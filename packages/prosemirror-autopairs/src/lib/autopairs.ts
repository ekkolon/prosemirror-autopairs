import { keymap } from 'prosemirror-keymap';
import { Command, Plugin, PluginKey, Selection } from 'prosemirror-state';

import {
  AUTOPAIR_GROUPS,
  AutopairGroup,
  BACKSPACE,
  Character,
  getClosingCharacter,
  isClosingCharacter,
  isMatchingCharacter,
  isMatchingPair,
  isOpeningCharacter,
} from './pairs';
import { isTextNode, shouldAutoClose, shouldSkipClosing } from './utils';

/**
 * Configuration object specifying which character groups should be auto-paired.
 * Each key corresponds to a character group, and the value determines whether
 * auto-pairing is enabled for that group.
 *
 * Only specified groups are considered; others fall back to defaults.
 */
export type AutopairsOptions = Partial<Record<AutopairGroup, boolean>>;

/**
 * Default configuration enabling all auto-pair groups.
 */
const defaultConfig = {
  angleBrackets: true,
  curlyBrackets: true,
  roundBrackets: true,
  squareBrackets: true,
  doubleQuotes: true,
  singleQuotes: true,
} satisfies AutopairsOptions;

/**
 * Unique key identifying an `autopairs` Plugin instance.
 */
export const AutopairsPluginKey = new PluginKey('autopairs');

/**
 * Creates a new ProseMirror plugin that implements intelligent auto-pairing of matching
 * characters (e.g., brackets, quotes) and smart backspace behavior.
 *
 * Features include:
 * - Auto-inserting closing characters when typing an opening character.
 * - Wrapping selected text with matching pairs.
 * - Skipping over existing closing characters when typed.
 * - Deleting matching pairs on backspace when the cursor is between them.
 *
 * @param options Configuration object to enable or disable specific autopair groups.
 * @returns A new ProseMirror {@link Plugin} instance.
 */
export function autopairs(options: AutopairsOptions = {}): Plugin {
  const keyBindings = buildKeyBindings(options);
  const autopairsKeymap = keymap(keyBindings);
  return new Plugin({ ...autopairsKeymap, key: AutopairsPluginKey });
}

/**
 * Complete set of keymap bindings for auto-pairing behavior.
 * Maps characters and special keys to ProseMirror commands.
 */
type KeyBindings = Record<Character, Command> & { Backspace: Command };

/**
 * Generates a ProseMirror-compatible keymap object for handling
 * auto-pairing behaviors related to opening and closing characters, as well as backspace.
 *
 * It maps each auto-closable opening/closing character to `createBracketInputCommand`
 * and the 'Backspace' key to `createBackspaceInputCommand`.
 *
 * @returns {Partial<KeyBindings>} A partial keymap object ready to be passed to `keymap()` plugin.
 */
function buildKeyBindings(options: AutopairsOptions): Partial<KeyBindings> {
  const chars = getEnabledAutopairChars(options);
  const mergeAutopairCharHandler = (bindings: Partial<KeyBindings>, char: string) => {
    return { ...bindings, [char]: createAutopairInputHandler(char) };
  };

  return {
    ...chars.reduce(mergeAutopairCharHandler, {}),
    [BACKSPACE]: createBackspaceInputHandler(),
  };
}

/**
 * Resolves the list of characters to handle for auto-pairing based on a given configuration.
 *
 * @param options - Partial configuration indicating which groups to enable.
 * If omitted or empty, all characters from all groups are returned.
 * @returns An array of auto-pair characters to handle.
 */
function getEnabledAutopairChars(options: AutopairsOptions = {}): Character[] {
  return Object.entries({ ...defaultConfig, ...options })
    .filter(([, enabled]) => !!enabled)
    .map(([group]) => AUTOPAIR_GROUPS[group as never])
    .flat();
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
function createAutopairInputHandler(char: unknown): Command {
  return (state, dispatch) => {
    // Ensure the typed character is recognized as auto-closable.
    if (!isMatchingCharacter(char)) return false;

    const { selection, schema } = state;
    const { from, to } = selection;

    const isOpeningChar = isOpeningCharacter(char);
    const isClosingChar = isClosingCharacter(char);
    const closingChar = getClosingCharacter(char as never);

    // --- Wrapping selected text
    if (!selection.empty) {
      // Cannot wrap with a closing character and very opening char should have a closing match.
      if (!isOpeningChar || !isClosingChar) return false;

      const selectedText = state.doc.textBetween(from, to);
      const wrappedText = char + selectedText + closingChar;

      if (dispatch) {
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
    if (isClosingChar && shouldSkipClosing(state, char)) {
      if (dispatch) {
        // Move the cursor one position forward, effectively "skipping" over the existing character.
        const pos = state.tr.doc.resolve(from + 1);
        const newSelection = Selection.near(pos);
        const tr = state.tr.setSelection(newSelection);
        dispatch(tr);
      }

      return true;
    }

    // --- Auto-closing an opening character
    // Applies when the cursor is empty and an opening character is typed.
    // It will insert the corresponding closing character immediately after.
    if (isOpeningChar && shouldAutoClose(state, char)) {
      // Construct the text to be inserted: e.g., "(" + ")" => "()"
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
function createBackspaceInputHandler(): Command {
  return (state, dispatch) => {
    const { selection } = state;

    // Only act if the selection is empty (i.e., a cursor, not a range selection).
    if (!selection.empty) return false;

    // $cursor is a ResolvedPos object at the current cursor position.
    const { $from: $cursor } = selection;

    // Get the TextNodes immediately before and after the cursor, if they exist.
    const beforeNode = $cursor.nodeBefore;
    const afterNode = $cursor.nodeAfter;

    // Ensure both are valid TextNodes to extract characters.
    if (!isTextNode(beforeNode) || !isTextNode(afterNode)) return false;

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
