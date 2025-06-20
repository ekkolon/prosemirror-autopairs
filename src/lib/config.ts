import {
  ALL_AUTOPAIR_CHARS,
  AUTOPAIR_CHAR_GROUPS,
  AutopairGroup,
  Char,
} from './chars';

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
 *
 * @internal
 */
export const defaultConfig = {
  angleBrackets: true,
  curlyBrackets: true,
  roundBrackets: true,
  squareBrackets: true,
  doubleQuotes: true,
  singleQuotes: true,
} satisfies AutopairsOptions;

/**
 * Resolves the list of characters to handle for auto-pairing,
 * based on a given configuration.
 *
 * @param options - Partial configuration indicating which groups to enable.
 * If omitted or empty, all characters from all groups are returned.
 * @returns An array of auto-pair characters to handle.
 */
export function resolveCharsToHandle(options: AutopairsOptions = {}): Char[] {
  const entries = Object.entries(options) as Array<[AutopairGroup, boolean]>;

  if (entries.length === 0) {
    return ALL_AUTOPAIR_CHARS;
  }

  return entries
    .filter(([, enabled]) => !!enabled)
    .map(([group]) => AUTOPAIR_CHAR_GROUPS[group])
    .flat();
}
