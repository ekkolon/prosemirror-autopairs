import { keymap } from 'prosemirror-keymap';
import { Command, Plugin, PluginKey, Selection } from 'prosemirror-state';

import {
  findClosingMatch,
  isAutopairChar,
  isClosingChar,
  isMatchingPair,
  isOpeningChar,
} from './chars';
import { AutopairsOptions, resolveCharsToHandle } from './config';
import {
  AutopairKeyBindingsConfig,
  KeyboardKey,
  buildAutopairKeyBindings,
} from './keymap';
import { isTextNode, shouldAutoClose, shouldSkipClosing } from './utils';

/**
 * Creates a new instance of the {@link AutopairsPlugin} with the given options.
 *
 * This is the recommended way to add auto-pairing behavior to your ProseMirror editor.
 *
 * @param options Configuration object to enable or disable specific autopair groups.
 * @returns A configured AutopairsPlugin instance.
 */
export function autopairs(options: AutopairsOptions = {}): AutopairsPlugin {
  return new AutopairsPlugin(options);
}

/**
 * Unique key identifying the AutopairsPlugin instance.
 */
export const AutopairsPluginKey = new PluginKey('autopairs');

/**
 * ProseMirror plugin that implements intelligent auto-pairing of matching
 * characters (e.g., brackets, quotes) and smart backspace behavior.
 *
 * Features include:
 * - Auto-inserting closing characters when typing an opening character.
 * - Wrapping selected text with matching pairs.
 * - Skipping over existing closing characters when typed.
 * - Deleting matching pairs on backspace when the cursor is between them.
 */
export class AutopairsPlugin extends Plugin {
  /**
   * Creates an AutopairsPlugin instance.
   *
   * Sets up key bindings to handle auto-pair insertion and deletion.
   *
   * @param options Configuration for enabling/disabling specific autopair groups.
   */
  constructor(options: AutopairsOptions = {}) {
    const autopairCharBindings = resolveCharsToHandle(options).reduce(
      (mapping, char) => ({ ...mapping, [char]: createAutopairCommandForChar }),
      {} as Partial<AutopairKeyBindingsConfig>,
    );

    const keyboardKeyBindings = {
      [KeyboardKey.Backspace]: createBackspaceInputCommand,
    } satisfies Partial<AutopairKeyBindingsConfig>;

    const autopairKeyBindings = buildAutopairKeyBindings({
      ...autopairCharBindings,
      ...keyboardKeyBindings,
    });

    super({ ...keymap(autopairKeyBindings), key: AutopairsPluginKey });
  }
}

/**
 * Creates a ProseMirror command to handle auto-pair insertion behavior for a given character.
 *
 * The command processes input in this order:
 * 1. Wraps selected text if an opening character is typed.
 * 2. Skips over an existing closing character if typed.
 * 3. Auto-inserts a matching closing character after an opening character.
 *
 * @internal
 * @param {unknown} char The typed character to handle. Must be an auto-pair character.
 * @returns A ProseMirror command function.
 */
export function createAutopairCommandForChar(char: unknown): Command {
  return (state, dispatch) => {
    // Ensure the typed character is recognized as auto-closable.
    if (!isAutopairChar(char)) {
      return false;
    }

    const { selection, schema } = state;
    const { from, to } = selection;

    // --- Wrapping selected text
    if (!selection.empty) {
      // Only wrap if an opening character is typed.

      if (!isOpeningChar(char)) {
        // Cannot wrap with a closing character.
        return false;
      }

      const closingChar = findClosingMatch(char);
      if (!closingChar) {
        // Defensive check: every opening char should have a closing match.
        return false;
      }

      if (dispatch) {
        const selectedText = state.doc.textBetween(from, to);
        const wrappedText = char + selectedText + closingChar;

        // Replace the selected content with the wrapped text.
        const content = schema.text(wrappedText);
        const tr = state.tr.replaceWith(from, to, content);

        // Position the cursor immediately after the newly wrapped text.
        // Resolve position to ensure it's valid within the updated document.
        const pos = tr.doc.resolve(from + wrappedText.length);
        const newSelection = Selection.near(pos);
        tr.setSelection(newSelection);
        dispatch(tr);
      }

      return true;
    }

    // --- Skipping an existing closing character
    // Applies when the cursor is empty and the typed character is a closing character
    // that matches the character immediately after the cursor.
    if (isClosingChar(char) && shouldSkipClosing(state, char)) {
      if (dispatch) {
        // Move the cursor one position forward, effectively "skipping" over the existing character.
        const pos = state.tr.doc.resolve(from + 1);
        const newSelection = Selection.near(pos); // Use Selection.near for robust cursor placement
        const tr = state.tr.setSelection(newSelection);
        dispatch(tr);
      }
      return true; // Command handled.
    }

    // --- Auto-closing an opening character
    // Applies when the cursor is empty and an opening character is typed.
    // It will insert the corresponding closing character immediately after.
    if (isOpeningChar(char) && shouldAutoClose(state, char)) {
      // Construct the text to be inserted: e.g., "(" + ")" => "()"
      const closingChar = findClosingMatch(char);
      const insertText = char + closingChar;

      if (dispatch) {
        // Insert the pair (e.g., "()") at the current cursor position.
        const tr = state.tr.insertText(insertText, from);

        // Position the cursor *between* the newly inserted opening and closing characters.
        // e.g., for "()", cursor moves to "from + 1" for "(|)".
        const pos = tr.doc.resolve(from + 1);
        const newSelection = Selection.near(pos);
        tr.setSelection(newSelection);
        dispatch(tr);
      }

      return true;
    }

    return false;
  };
}

/**
 * Creates a ProseMirror `Command` to handle intelligent backspace behavior.
 * Deletes both characters if the cursor is between a known matching pair.
 *
 * @internal
 * @returns A ProseMirror command function.
 */
export function createBackspaceInputCommand(): Command {
  return (state, dispatch) => {
    const { selection } = state;

    // Only act if the selection is empty (i.e., a cursor, not a range selection).
    if (!selection.empty) {
      return false;
    }

    // $cursor is a ResolvedPos object at the current cursor position.
    const { $from: $cursor } = selection;

    // Get the TextNodes immediately before and after the cursor, if they exist.
    const beforeNode = $cursor.nodeBefore;
    const afterNode = $cursor.nodeAfter;

    // Ensure both are valid TextNodes to extract characters.
    if (!isTextNode(beforeNode) || !isTextNode(afterNode)) {
      return false;
    }

    // Extract the character immediately before and after the cursor.
    const charBefore = beforeNode.text[beforeNode.text.length - 1];
    const charAfter = afterNode.text[0];

    // Check if these two characters form a known auto-closable pair.
    if (isMatchingPair(charBefore, charAfter)) {
      if (dispatch) {
        // Define the range to delete: from before the opening char to after the closing char.
        // $cursor.pos - 1 is the position of the character *before* the cursor.
        // $cursor.pos + 1 is the position of the character *after* the cursor.
        const tr = state.tr.delete($cursor.pos - 1, $cursor.pos + 1);
        dispatch(tr);
      }

      return true;
    }

    return false;
  };
}
