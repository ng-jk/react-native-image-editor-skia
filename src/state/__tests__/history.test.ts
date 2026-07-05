import {
  canRedo,
  canUndo,
  commit,
  initHistory,
  redo,
  replacePresent,
  undo,
} from '../history';

describe('history', () => {
  it('commits, undoes and redoes', () => {
    let h = initHistory(0);
    h = commit(h, 1);
    h = commit(h, 2);
    expect(h.present).toBe(2);
    expect(canUndo(h)).toBe(true);

    h = undo(h);
    expect(h.present).toBe(1);
    h = undo(h);
    expect(h.present).toBe(0);
    expect(canUndo(h)).toBe(false);

    h = redo(h);
    expect(h.present).toBe(1);
    expect(canRedo(h)).toBe(true);
  });

  it('commit clears the redo stack', () => {
    let h = initHistory('a');
    h = commit(h, 'b');
    h = undo(h); // present 'a', future ['b']
    h = commit(h, 'c');
    expect(h.present).toBe('c');
    expect(canRedo(h)).toBe(false);
  });

  it('replacePresent does not create an undo step', () => {
    let h = initHistory(0);
    h = commit(h, 1);
    const before = h.past.length;
    h = replacePresent(h, 99);
    expect(h.present).toBe(99);
    expect(h.past.length).toBe(before);
  });
});
