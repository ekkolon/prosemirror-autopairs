import type { Command } from 'prosemirror-state';
import { Char } from './chars';

/**
 * Enum of supported special keyboard keys.
 */
export enum KeyboardKey {
  Backspace = 'Backspace',
}

/**
 * Factory function type for creating ProseMirror `Command` instances.
 * Accepts any arguments depending on the specific command context.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AutopairKeyBindingCommandFactory = (...args: any[]) => Command;

/**
 * Complete set of keymap bindings for auto-pairing behavior.
 * Maps characters and special keys to ProseMirror commands.
 */
export type AutopairKeyBindings = Record<Char | KeyboardKey, Command>;

/**
 * Configuration object for building the keymap.
 * Maps characters and keys to their respective command factory functions.
 */
export type AutopairKeyBindingsConfig = Record<
  keyof AutopairKeyBindings,
  AutopairKeyBindingCommandFactory
>;

type PartialAutopairKeyBindings = Partial<AutopairKeyBindings>;

/**
 * Builds a ProseMirror-compatible keymap object for handling
 * auto-pairing and backspace behaviors.
 *
 * For each entry in the provided mapping, invokes the factory function
 * with the key to generate the corresponding command.
 *
 * @param mapping - Partial map of characters/keys to command factories.
 * @returns A partial keymap object suitable for use with the `keymap()` plugin.
 */
export function buildAutopairKeyBindings(
  mapping: Partial<AutopairKeyBindingsConfig>,
): PartialAutopairKeyBindings {
  const charHandlerReducer = (
    record: PartialAutopairKeyBindings,
    [keyOrChar, factory]: [
      Char | KeyboardKey,
      AutopairKeyBindingCommandFactory,
    ],
  ) => ({
    ...record,
    [keyOrChar]: factory(keyOrChar),
  });

  return Object.entries(mapping).reduce(charHandlerReducer, {});
}
