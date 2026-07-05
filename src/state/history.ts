import { MAX_HISTORY } from '../constants';

/**
 * Generic, pure undo/redo history over an immutable document `T`.
 * Snapshots are cheap here because the document is plain JSON (annotations +
 * scene transform) — it never contains image bytes.
 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** Replace the present, pushing the old present onto the undo stack. */
export function commit<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) {
    return history;
  }
  const past = [...history.past, history.present];
  // Cap the depth to bound memory.
  if (past.length > MAX_HISTORY) {
    past.shift();
  }
  return { past, present: next, future: [] };
}

/**
 * Replace the present WITHOUT creating a history entry — used for live edits
 * (e.g. typing in a text box) that should collapse into the eventual commit.
 */
export function replacePresent<T>(history: History<T>, next: T): History<T> {
  return { ...history, present: next };
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1]!;
  const past = history.past.slice(0, -1);
  return {
    past,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0]!;
  const future = history.future.slice(1);
  return {
    past: [...history.past, history.present],
    present: next,
    future,
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}
