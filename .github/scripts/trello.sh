#!/usr/bin/env bash
# Trello helper for the CI task-runner. Subcommands: select-and-claim, finalize.
# Requires env: TRELLO_KEY TRELLO_TOKEN TRELLO_BOARD_ID
#               TRELLO_INPROGRESS_LIST_ID TRELLO_INREVIEW_LIST_ID
# Writes .trello-card.json (select-and-claim) and reads .trello-result.json (finalize).
# Logs go to stderr; select-and-claim prints ONLY the selected card id to stdout.
set -euo pipefail

API="https://api.trello.com/1"
CARD_FILE=".trello-card.json"
RESULT_FILE=".trello-result.json"
log() { echo "[trello] $*" >&2; }
_auth() { echo "key=${TRELLO_KEY}&token=${TRELLO_TOKEN}"; }

api_get()   { local sep="?"; [[ "$1" == *\?* ]] && sep="&"; curl -fsS "${API}$1${sep}$(_auth)"; }
board_labels() { api_get "/boards/${TRELLO_BOARD_ID}/labels?fields=name,color"; }
list_cards()   { api_get "/lists/$1/cards?fields=name,desc,idLabels,pos"; }
create_label() { curl -fsS -X POST "${API}/labels?$(_auth)" --data-urlencode "name=$1" --data-urlencode "color=$2" --data-urlencode "idBoard=${TRELLO_BOARD_ID}"; }
add_label()    { curl -fsS -X POST   "${API}/cards/$1/idLabels?value=$2&$(_auth)" >/dev/null; }
remove_label() { curl -fsS -X DELETE "${API}/cards/$1/idLabels/$2?$(_auth)" >/dev/null || true; }
comment()      { curl -fsS -X POST "${API}/cards/$1/actions/comments?$(_auth)" --data-urlencode "text=$2" >/dev/null; }
move_card()    { curl -fsS -X PUT  "${API}/cards/$1?idList=$2&$(_auth)" >/dev/null; }

AGENT_MARKER="🤖"
# Latest comment text on a card ("" if none). Used to detect a user reply.
latest_comment_text() { api_get "/cards/$1/actions?filter=commentCard&limit=1" | jq -r '.[0].data.text // ""'; }
# Up to 20 comments, oldest→newest, as [{text,date}] — passed to the agent for context.
card_comments()       { api_get "/cards/$1/actions?filter=commentCard&limit=20" | jq '[ .[] | {text: .data.text, date: .date} ] | reverse'; }

ensure_label() { # $1=name $2=color -> echoes id
  local id
  id="$(board_labels | jq -r --arg n "$1" '.[] | select(.name==$n) | .id' | head -1)"
  [[ -z "$id" ]] && id="$(create_label "$1" "$2" | jq -r '.id')"
  echo "$id"
}

cmd_select_and_claim() {
  local wip info cards row cid has_info last card id name reopened=0
  wip="$(ensure_label "claude:wip" "yellow")"
  info="$(ensure_label "needs-info" "orange")"
  log "labels: wip=$wip needs-info=$info"
  cards="$(list_cards "$TRELLO_INPROGRESS_LIST_ID")"

  # Candidates: no claude:wip, sorted by pos. A needs-info card is eligible ONLY if
  # its latest comment is the user's reply (not agent-marked, not empty).
  card=""
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    cid="$(jq -r '.id' <<<"$row")"
    has_info="$(jq -r --arg i "$info" '((.idLabels|index($i)) != null)' <<<"$row")"
    if [[ "$has_info" == "true" ]]; then
      last="$(latest_comment_text "$cid")"
      case "$last" in
        "$AGENT_MARKER"*) continue ;;   # agent asked last → still waiting on the user
        "")               continue ;;   # no reply yet
      esac
      reopened=1
    fi
    card="$row"; break
  done < <(echo "$cards" | jq -c --arg w "$wip" '[ .[] | select(.idLabels|index($w)|not) ] | sort_by(.pos) | .[]')

  if [[ -z "$card" ]]; then log "no eligible card"; exit 0; fi
  id="$(jq -r '.id' <<<"$card")"
  name="$(jq -r '.name' <<<"$card")"
  log "selected: $name ($id) reopened=$reopened"
  jq --argjson comments "$(card_comments "$id")" '{id, name, desc} + {comments: $comments}' <<<"$card" > "$CARD_FILE"
  [[ "$reopened" == "1" ]] && remove_label "$id" "$info"
  add_label "$id" "$wip"
  comment "$id" "🤖 Взял в работу. Ветка и PR появятся здесь."
  echo "$id"   # stdout = card id only
}

cmd_finalize() { # $1 = card id
  local id="$1" wip info status pr q note
  wip="$(ensure_label "claude:wip" "yellow")"
  info="$(ensure_label "needs-info" "orange")"
  if [[ ! -f "$RESULT_FILE" ]]; then
    log "no $RESULT_FILE — infra/agent failure; returning card to queue"
    comment "$id" "🤖 ⚠️ Прогон не дал результата (инфраструктура/агент). Карточка возвращена в очередь для повтора. См. Actions-лог."
    remove_label "$id" "$wip"; return 0
  fi
  status="$(jq -r '.status' "$RESULT_FILE")"
  log "result: $status"
  case "$status" in
    pr)
      pr="$(jq -r '.prUrl' "$RESULT_FILE")"
      if [[ -z "$pr" || "$pr" == "null" ]]; then
        log "status=pr but prUrl empty (Open PR step failed) — returning card to queue"
        comment "$id" "🤖 ⚠️ Код готов, но PR открыть не удалось (см. Actions-лог). Карточка возвращена в очередь."
        remove_label "$id" "$wip"
      else
        comment "$id" "🤖 ✅ Готово. PR: $pr"
        move_card "$id" "$TRELLO_INREVIEW_LIST_ID"
        remove_label "$id" "$wip"
      fi ;;
    needs-info)
      q="$(jq -r '.questions[]? | "• " + .' "$RESULT_FILE")"
      comment "$id" "🤖 ❓ Нужны уточнения — ответьте комментарием, и я продолжу:
$q"
      add_label "$id" "$info"; remove_label "$id" "$wip" ;;
    *)
      note="$(jq -r '.note // "unknown error"' "$RESULT_FILE")"
      comment "$id" "🤖 ⚠️ Ошибка: $note (см. Actions-лог)."
      add_label "$id" "$info"; remove_label "$id" "$wip" ;;
  esac
}

case "${1:-}" in
  select-and-claim) cmd_select_and_claim ;;
  finalize) cmd_finalize "${2:?card id required}" ;;
  *) echo "usage: $0 {select-and-claim|finalize <cardId>}" >&2; exit 2 ;;
esac
