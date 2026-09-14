export type FilterVerdict = { dispatch: boolean; reason: string };

/** Префикс, которым помечены все комментарии агента (см. AGENT_MARKER в .github/scripts/trello.sh). */
export const AGENT_MARKER = '🤖';

type TrelloAction = {
  type?: unknown;
  data?: {
    listAfter?: { id?: unknown } | null;
    text?: unknown;
  } | null;
};

/**
 * Решает, надо ли запускать trello-agent.yml по этому экшену Trello.
 *
 * Два правила:
 *   1. updateCard, у которого data.listAfter.id === список In Progress;
 *   2. commentCard с непустым текстом, не начинающимся с AGENT_MARKER.
 *
 * ВАЖНО: только listAfter. Одно перетаскивание карточки порождает ДВА updateCard-экшена
 * (смена списка и подгонка pos), и listAfter есть только у первого. Поле data.list.id
 * присутствует при любой правке карточки, уже лежащей в списке, поэтому фолбэк на него
 * даёт ложные срабатывания — этот баг уже был выловлен 2026-08-25.
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
