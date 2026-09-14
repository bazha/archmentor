import { describe, expect, it } from 'vitest';
import { shouldDispatch } from './filter';

const IN_PROGRESS = 'list-in-progress';
const TODO = 'list-todo';

// Dragging a card into In Progress: THIS action is the one that carries listAfter.
const movedIntoInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', name: 'Some card', idShort: 42 },
    old: { idList: TODO },
    board: { id: 'board-1', name: 'ArchMentor' },
    listBefore: { id: TODO, name: 'To Do' },
    listAfter: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

// The second action of the SAME drag — position only. No listAfter, but there is a list.
const posOnlyInInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', pos: 65535 },
    old: { pos: 131071 },
    board: { id: 'board-1', name: 'ArchMentor' },
    list: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

// Renaming a card that is already sitting in In Progress.
const renamedInInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', name: 'Some card (renamed)' },
    old: { name: 'Some card' },
    board: { id: 'board-1', name: 'ArchMentor' },
    list: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

const movedToDone = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1' },
    old: { idList: IN_PROGRESS },
    listBefore: { id: IN_PROGRESS, name: 'In Progress' },
    listAfter: { id: 'list-done', name: 'Done' },
  },
};

const userComment = {
  type: 'commentCard',
  data: {
    card: { id: 'card-1', name: 'Some card' },
    board: { id: 'board-1' },
    text: 'да, делай через zustand',
  },
};

const agentComment = {
  type: 'commentCard',
  data: {
    card: { id: 'card-1', name: 'Some card' },
    board: { id: 'board-1' },
    text: '🤖 Взял в работу. Ветка и PR появятся здесь.',
  },
};

describe('shouldDispatch', () => {
  it('dispatches when a card is dragged into In Progress', () => {
    expect(shouldDispatch(movedIntoInProgress, IN_PROGRESS).dispatch).toBe(true);
  });

  it('ignores the pos-only twin of the same drag', () => {
    expect(shouldDispatch(posOnlyInInProgress, IN_PROGRESS).dispatch).toBe(false);
  });

  // Regression: a naive data.list.id filter fired on any edit of a card in In Progress.
  it('ignores an edit of a card already sitting in In Progress', () => {
    expect(shouldDispatch(renamedInInProgress, IN_PROGRESS).dispatch).toBe(false);
  });

  it('ignores a move into any other list', () => {
    expect(shouldDispatch(movedToDone, IN_PROGRESS).dispatch).toBe(false);
  });

  it('dispatches on a comment from the user', () => {
    expect(shouldDispatch(userComment, IN_PROGRESS).dispatch).toBe(true);
  });

  it('ignores a comment written by the agent', () => {
    expect(shouldDispatch(agentComment, IN_PROGRESS).dispatch).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['updateCard without data', { type: 'updateCard' }],
    ['commentCard without data', { type: 'commentCard' }],
    ['unknown type', { type: 'createCard', data: { card: { id: 'card-1' } } }],
  ])('ignores garbage payload: %s', (_label, payload) => {
    expect(shouldDispatch(payload, IN_PROGRESS).dispatch).toBe(false);
  });

  it('explains its verdict', () => {
    expect(shouldDispatch(movedIntoInProgress, IN_PROGRESS).reason).toMatch(/In Progress/);
    expect(shouldDispatch(agentComment, IN_PROGRESS).reason).toMatch(/agent/);
  });
});
