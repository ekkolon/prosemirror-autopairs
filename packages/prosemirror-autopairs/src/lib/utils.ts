import type { EditorState, NodeSelection } from 'prosemirror-state';
import { isQuote } from './pairs';

/**
 * Represents a ProseMirror text node.
 * @internal
 */
export type Node = NodeSelection['node'];

/**
 * Represents a ProseMirror text node with a concrete `text` property.
 */
type TextNode = Node & { text: string };

/**
 * Type guard that checks whether a node is a text node.
 */
export const isTextNode = (node: Node | null): node is TextNode => {
  return !!node && node.isText === true;
};

/**
 * Returns true if either `charBefore` or `charAfter` is a word character.
 * Word characters include letters, numbers, and underscores.
 */
export function isAdjacentToWordChar(charBefore: string, charAfter: string): boolean {
  const wordCharRegex = /\w/;
  return wordCharRegex.test(charBefore) || wordCharRegex.test(charAfter);
}

/**
 * Checks whether a typed closing character should be skipped.
 * Returns true if the cursor is directly before a matching closing character.
 */
export function shouldSkipClosing(state: EditorState, char: string): boolean {
  const { selection } = state;
  if (!selection.empty) return false;
  const { $from } = selection;
  const nodeAfter = $from.nodeAfter;
  return isTextNode(nodeAfter) && nodeAfter.text?.startsWith(char);
}

/**
 * Checks whether an opening character should auto-close.
 * Always returns true for brackets. For quote characters, returns false
 * if adjacent to word characters to avoid breaking words.
 */
export function shouldAutoClose(state: EditorState, openChar: string): boolean {
  const { selection } = state;
  const { $from } = selection;

  // Auto-close always allowed when wrapping selected text
  if (!selection.empty) return true;

  // Quotes should not auto-close when touching word characters
  if (isQuote(openChar)) {
    const nodeBefore = $from.nodeBefore;
    const nodeAfter = $from.nodeAfter;

    const charBefore =
      isTextNode(nodeBefore) && nodeBefore.text ? (nodeBefore.text.at(-1) ?? '') : '';

    const charAfter = isTextNode(nodeAfter) && nodeAfter.text ? nodeAfter.text[0] : '';

    return !isAdjacentToWordChar(charBefore, charAfter);
  }

  return true;
}
