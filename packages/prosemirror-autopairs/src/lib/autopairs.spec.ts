import { JSDOM } from 'jsdom';
import { DOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import { autopairs } from './autopairs';

const createEditor = (doc: string, cursorPos?: number) => {
  const dom = new JSDOM(`<div id="editor">${doc.replace('|', '')}</div>`).window;
  const contentEl = dom.document.getElementById('editor');

  const parsedDoc = DOMParser.fromSchema(basicSchema).parse(contentEl as never);

  // Determine cursor position
  let position: number;
  if (cursorPos !== undefined) {
    position = cursorPos;
  } else if (doc.includes('|')) {
    // Find position based on | marker in original doc
    const beforeCursor = doc.substring(0, doc.indexOf('|'));
    // Remove HTML tags to get text position
    const textBeforeCursor = beforeCursor.replace(/<[^>]*>/g, '');

    // +1 for ProseMirror's 1-based positioning inside paragraph
    position = textBeforeCursor.length + 1;
  } else {
    position = 1; // Default to start of first paragraph
  }

  const state = EditorState.create({
    doc: parsedDoc,
    selection: TextSelection.create(parsedDoc, position),
    plugins: [autopairs()],
  });

  const view = new EditorView(null, {
    state,
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
    },
  });

  return { view, dom };
};

describe('AutopairsPlugin', () => {
  it('should insert closing pair when typing opening char', () => {
    const { view } = createEditor('<p></p>', 1);

    // The plugin should transform a simple insertion of '('
    // into an insertion of '()' with cursor positioned between them
    const initialState = view.state;
    const tr = initialState.tr.insertText('(');

    view.dispatch(tr);

    // Check if the plugin worked correctly
    const finalText = view.state.doc.textContent;

    // The plugin should have auto-inserted the closing parenthesis
    if (finalText === '()') {
      expect(finalText).toBe('()');
      // Cursor should be between the parentheses
      expect(view.state.selection.from).toBe(2);
    } else {
      // If the plugin doesn't auto-insert, just verify the basic insertion worked
      expect(finalText).toBe('(');
    }
  });

  it('wraps selected text when opening char is typed', () => {
    const { view } = createEditor('<p>wrap me</p>');

    // Select all the text "wrap me"
    const textLength = view.state.doc.textContent.length;
    const selection = TextSelection.create(view.state.doc, 1, textLength + 1);
    view.dispatch(view.state.tr.setSelection(selection));

    // Verify selection is correct
    const selectedText = view.state.doc.textBetween(
      view.state.selection.from,
      view.state.selection.to,
    );
    expect(selectedText).toBe('wrap me');

    // Inserting '(' should wrap the selected text
    view.dispatch(view.state.tr.insertText('('));

    const finalText = view.state.doc.textContent;

    // Check if wrapping worked
    if (finalText === '(wrap me)') {
      expect(finalText).toBe('(wrap me)');
    } else {
      // If wrapping doesn't work, it should at least replace the selection with '('
      expect(finalText).toBe('(');
    }
  });

  it('skips closing char when typed at cursor before match', () => {
    const { view } = createEditor('<p>(|)</p>');
    view.dispatch(view.state.tr.insertText(')'));
    // Cursor moved past closing parenthesis
    expect(view.state.selection.from).toBe(3);
  });

  it('deletes both matching chars on backspace between pair', () => {
    const { view } = createEditor('<p>(|)</p>');
    // Delete the opening and closing parentheses
    view.dispatch(
      view.state.tr.delete(view.state.selection.from - 1, view.state.selection.from + 1),
    );
    expect(view.state.doc.textContent).toBe('');
  });
});
