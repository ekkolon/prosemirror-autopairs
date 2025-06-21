import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isAdjacentToWordChar,
  isTextNode,
  Node,
  shouldAutoClose,
  shouldSkipClosing,
} from './utils';

vi.mock('./pairs', () => ({
  isQuote: vi.fn((char: string) => ['"', "'", '`'].includes(char)),
}));

import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { isQuote } from './pairs';

const testSchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() {
        return ['p', 0];
      },
    },
    text: { group: 'inline' },
  },
});

function createEditorState(
  input: string,
  explicitStart?: number,
  explicitEnd?: number,
): EditorState {
  const cursorPos = input.indexOf('|');
  const selectionEnd = input.indexOf('|', cursorPos + 1);
  const text = input.replace(/\|/g, '');

  const textNode = testSchema.text(text);
  const paragraph = testSchema.nodes.paragraph.create(null, textNode);
  const doc = testSchema.nodes.doc.create(null, paragraph);

  const start = explicitStart ?? cursorPos;
  const end = explicitEnd ?? (selectionEnd > cursorPos ? selectionEnd - 1 : start);

  if (start < 0 || end < 0)
    throw new Error('Cursor position not provided or malformed input string.');

  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, start, end),
  });
}

describe('Autopairs Utilities', () => {
  let schema: Schema;

  beforeAll(() => {
    schema = testSchema;
  });

  describe('isTextNode', () => {
    it('should return true for a TextNode', () => {
      const node = schema.text('hello');
      expect(isTextNode(node)).toBe(true);
    });

    it('should return false for a non-TextNode', () => {
      const node = schema.nodes['doc'].create(null, schema.text('hello'));
      expect(isTextNode(node)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTextNode(null)).toBe(false);
    });

    it('should refine type to TextNode', () => {
      const node: Node | null = schema.text('test');
      if (isTextNode(node)) {
        expect(node.text).toBe('test');
      } else {
        expect.fail('Node should be a TextNode');
      }
    });
  });

  describe('isAdjacentToWordChar', () => {
    it('should return true if charBefore is a word character', () => {
      expect(isAdjacentToWordChar('a', '(')).toBe(true);
      expect(isAdjacentToWordChar('1', '{')).toBe(true);
      expect(isAdjacentToWordChar('_', '[')).toBe(true);
    });

    it('should return true if charAfter is a word character', () => {
      expect(isAdjacentToWordChar('(', 'a')).toBe(true);
      expect(isAdjacentToWordChar('{', '1')).toBe(true);
      expect(isAdjacentToWordChar('[', '_')).toBe(true);
    });

    it('should return true if both are word characters', () => {
      expect(isAdjacentToWordChar('a', 'b')).toBe(true);
      expect(isAdjacentToWordChar('1', '2')).toBe(true);
    });

    it('should return false if neither are word characters', () => {
      expect(isAdjacentToWordChar('(', ')')).toBe(false);
      expect(isAdjacentToWordChar('{', '}')).toBe(false);
      expect(isAdjacentToWordChar(' ', ' ')).toBe(false);
      expect(isAdjacentToWordChar('', '')).toBe(false);
      expect(isAdjacentToWordChar('-', '+')).toBe(false);
    });

    it('should handle mixed non-word characters', () => {
      expect(isAdjacentToWordChar(' ', '}')).toBe(false);
      expect(isAdjacentToWordChar('(', ' ')).toBe(false);
    });
  });

  describe('shouldSkipClosing', () => {
    it('should return false if selection is not empty', () => {
      const state = createEditorState('he|llo', 2, 4);
      expect(shouldSkipClosing(state, ')')).toBe(false);
    });

    it('should return true if cursor is before matching closing char', () => {
      // cursor before ')'; Note that we need to account for `|`
      const state = createEditorState('hello)|world', 6);
      expect(shouldSkipClosing(state, ')')).toBe(true);
    });

    it('should return false if cursor is before non-matching char', () => {
      const state = createEditorState('hello}world', 5);
      expect(shouldSkipClosing(state, ')')).toBe(false);
    });

    it('should return false if no node after cursor', () => {
      const state = createEditorState('hello|', 5); // cursor at end
      expect(shouldSkipClosing(state, ')')).toBe(false);
    });

    it('should return false if node after cursor is not a text node', () => {
      const state = createEditorState('|hello', 0);
      vi.spyOn(state.selection.$from, 'nodeAfter', 'get').mockReturnValue(null);
      expect(shouldSkipClosing(state, ')')).toBe(false);
      vi.spyOn(state.selection.$from, 'nodeAfter', 'get').mockRestore();
    });
  });

  describe('shouldAutoClose', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (isQuote as any).mockClear();
    });

    it('should return true if selection is not empty (wrapping text)', () => {
      const state = createEditorState('h|ello', 1, 3);
      expect(shouldAutoClose(state, '(')).toBe(true);
    });

    it('should return true for non-quote chars regardless of adjacent word chars', () => {
      const state1 = createEditorState('a|b');
      expect(shouldAutoClose(state1, '(')).toBe(true);

      const state2 = createEditorState('(|)');
      expect(shouldAutoClose(state2, '{')).toBe(true);
    });

    describe('when openChar is a quote', () => {
      beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (isQuote as any).mockReturnValue(true);
      });

      it('should return false if adjacent to word character (before)', () => {
        const state = createEditorState('word"|', 5);
        expect(shouldAutoClose(state, '"')).toBe(false);
      });

      it('should return false if adjacent to word character (after)', () => {
        const state = createEditorState('|word"', 1); // Note that we need to account for
        expect(shouldAutoClose(state, '"')).toBe(false);
      });

      it('should return false if adjacent to word characters both sides', () => {
        const state = createEditorState('word"|word', 5);
        expect(shouldAutoClose(state, '"')).toBe(false);
      });

      it('should return true if not adjacent to word characters', () => {
        const state1 = createEditorState('" |"', 2);
        expect(shouldAutoClose(state1, '"')).toBe(true);

        const state2 = createEditorState('("|")', 2);
        expect(shouldAutoClose(state2, '"')).toBe(true);

        const state3 = createEditorState(' | ', 1);
        expect(shouldAutoClose(state3, '"')).toBe(true);

        const state4 = createEditorState('""|', 2);
        expect(shouldAutoClose(state4, '"')).toBe(true);
      });

      it('should handle start/end of text safely', () => {
        const state1 = createEditorState('|abc', 1); // Note that we need to account for |
        expect(shouldAutoClose(state1, '"')).toBe(false);

        const state2 = createEditorState('abc|', 4); // Note that we need to account for |
        expect(shouldAutoClose(state2, '"')).toBe(false);
      });
    });
  });
});
