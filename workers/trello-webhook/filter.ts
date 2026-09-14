export type FilterVerdict = { dispatch: boolean; reason: string };

/** The prefix marking every agent comment (see AGENT_MARKER in .github/scripts/trello.sh). */
export const AGENT_MARKER = '🤖';

type TrelloAction = {
  type?: unknown;
  data?: {
    listAfter?: { id?: unknown } | null;
    text?: unknown;
  } | null;
};

/**
 * Decides whether this Trello action should start trello-agent.yml.
 *
 * Two rules:
 *   1. updateCard whose data.listAfter.id is the In Progress list;
 *   2. commentCard with non-empty text that does not start with AGENT_MARKER.
 *
 * IMPORTANT: listAfter only. A single card drag produces TWO updateCard actions
 * (the list change and the pos adjustment), and only the first carries listAfter.
 * The data.list.id field is present on any edit of a card already in the list, so
 * falling back to it causes false triggers — that bug was already caught on 2026-08-25.
 */
export function shouldDispatch(action: unknown, inProgressListId: string): FilterVerdict {
  const candidate = (action ?? {}) as TrelloAction;
  const type = typeof candidate.type === 'string' ? candidate.type : '';
  const data = candidate.data ?? {};

  if (type === 'updateCard') {
    const listAfter = data.listAfter?.id;
    if (typeof listAfter === 'string' && listAfter !== '' && listAfter === inProgressListId) {
      return { dispatch: true, reason: 'card moved into In Progress' };
    }
    return { dispatch: false, reason: 'updateCard without listAfter = In Progress' };
  }

  if (type === 'commentCard') {
    const text = typeof data.text === 'string' ? data.text : '';
    if (text === '') return { dispatch: false, reason: 'commentCard without text' };
    if (text.startsWith(AGENT_MARKER)) return { dispatch: false, reason: 'agent comment' };
    return { dispatch: true, reason: 'user comment' };
  }

  return { dispatch: false, reason: `ignored action type: ${type || '(none)'}` };
}
