import { useReducer } from 'react';

import type { Annotation, EditorDocument, SceneTransform } from '../types';
import { IDENTITY_SCENE } from '../types';
import {
  commit,
  initHistory,
  redo as redoHistory,
  replacePresent,
  undo as undoHistory,
} from './history';
import type { History } from './history';

export type EditorAction =
  | { type: 'ADD_ANNOTATION'; annotation: Annotation }
  | {
      type: 'UPDATE_ANNOTATION';
      id: string;
      changes: Partial<Annotation>;
      /** When true, does not create a history entry (live edit). */
      transient?: boolean;
    }
  | { type: 'DELETE_ANNOTATION'; id: string }
  | {
      type: 'SET_SCENE';
      changes: Partial<SceneTransform>;
      /** When true, does not create a history entry (live slider drag). */
      transient?: boolean;
    }
  | { type: 'REPLACE'; document: EditorDocument }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export type EditorState = History<EditorDocument>;

const EMPTY_DOCUMENT: EditorDocument = {
  annotations: [],
  scene: IDENTITY_SCENE,
};

function nextZ(annotations: Annotation[]): number {
  return annotations.reduce((max, a) => Math.max(max, a.z), 0) + 1;
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  const doc = state.present;
  switch (action.type) {
    case 'ADD_ANNOTATION': {
      const annotation = { ...action.annotation, z: nextZ(doc.annotations) };
      return commit(state, {
        ...doc,
        annotations: [...doc.annotations, annotation],
      });
    }
    case 'UPDATE_ANNOTATION': {
      const annotations = doc.annotations.map((a) =>
        a.id === action.id ? ({ ...a, ...action.changes } as Annotation) : a
      );
      const next = { ...doc, annotations };
      return action.transient ? replacePresent(state, next) : commit(state, next);
    }
    case 'DELETE_ANNOTATION': {
      return commit(state, {
        ...doc,
        annotations: doc.annotations.filter((a) => a.id !== action.id),
      });
    }
    case 'SET_SCENE': {
      const next = { ...doc, scene: { ...doc.scene, ...action.changes } };
      return action.transient ? replacePresent(state, next) : commit(state, next);
    }
    case 'REPLACE': {
      return commit(state, action.document);
    }
    case 'RESET': {
      return commit(state, EMPTY_DOCUMENT);
    }
    case 'UNDO':
      return undoHistory(state);
    case 'REDO':
      return redoHistory(state);
    default:
      return state;
  }
}

export function useEditorReducer(initial?: Partial<EditorDocument>) {
  return useReducer(
    reducer,
    initHistory<EditorDocument>({ ...EMPTY_DOCUMENT, ...initial })
  );
}
