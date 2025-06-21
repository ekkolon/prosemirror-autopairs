export const BACKSPACE = 'Backspace';

/**
 * Defines quote characters used in auto-pairing logic.
 */
export enum Quote {
  Double = '"',
  Single = "'",
}

/**
 * Defines opening bracket characters for auto-pairing.
 */
export enum OpeningBracket {
  Round = '(', // Parentheses
  Square = '[', // Square brackets
  Curly = '{', // Curly braces
  Angle = '<', // Angle brackets
}

/**
 * Defines closing bracket characters for auto-pairing.
 */
export enum ClosingBracket {
  Round = ')',
  Square = ']',
  Curly = '}',
  Angle = '>',
}

/**
 * Union type of all bracket characters (opening or closing).
 */
export type Bracket = OpeningBracket | ClosingBracket;

/**
 * Union type of all opening characters (brackets and quotes).
 */
export type OpeningCharacter = OpeningBracket | Quote;

/**
 * Union type of all closing characters (brackets and quotes).
 */
export type ClosingCharacter = ClosingBracket | Quote;

/**
 * Union type of all auto-pair characters (opening or closing).
 */
export type Character = OpeningCharacter | ClosingCharacter;

/**
 * Maps opening characters to their corresponding closing characters.
 *
 * @internal
 */
export const OPEN_CLOSE_MAPPING: Record<OpeningCharacter, ClosingCharacter> = {
  [OpeningBracket.Angle]: ClosingBracket.Angle,
  [OpeningBracket.Curly]: ClosingBracket.Curly,
  [OpeningBracket.Round]: ClosingBracket.Round,
  [OpeningBracket.Square]: ClosingBracket.Square,
  [Quote.Double]: Quote.Double,
  [Quote.Single]: Quote.Single,
};

/**
 * @internal
 */
export const ALL_OPENING_CHARS = Object.keys(OPEN_CLOSE_MAPPING) as OpeningCharacter[];

/**
 * @internal
 */
export const ALL_CLOSING_CHARS = Object.values(OPEN_CLOSE_MAPPING);

/**
 * @internal
 */
export const ALL_AUTOPAIR_CHARS = [...ALL_OPENING_CHARS, ...ALL_CLOSING_CHARS];

/**
 * Logical groupings of auto-pair character sets.
 */
export enum AutopairGroup {
  RoundBrackets = 'roundBrackets',
  AngleBrackets = 'angleBrackets',
  CurlyBrackets = 'curlyBrackets',
  SquareBrackets = 'squareBrackets',
  DoubleQuotes = 'doubleQuotes',
  SingleQuotes = 'singleQuotes',
}

/**
 * Mapping of character groups to their associated characters.
 *
 * @internal
 */
export const AUTOPAIR_GROUPS = {
  [AutopairGroup.AngleBrackets]: [OpeningBracket.Angle, ClosingBracket.Angle],
  [AutopairGroup.CurlyBrackets]: [OpeningBracket.Curly, ClosingBracket.Curly],
  [AutopairGroup.RoundBrackets]: [OpeningBracket.Round, ClosingBracket.Round],
  [AutopairGroup.SquareBrackets]: [OpeningBracket.Square, ClosingBracket.Square],
  [AutopairGroup.DoubleQuotes]: [Quote.Double],
  [AutopairGroup.SingleQuotes]: [Quote.Single],
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const ALL_CHAR_GROUPS = Object.values(AutopairGroup);
/**
 * @internal
 */
export const isAutopairGroup = (group: unknown): group is AutopairGroup => {
  return isString(group) && ALL_CHAR_GROUPS.includes(group as never);
};

/**
 * Checks whether a character is one of the quote characters.
 */
export const isQuote = (char: unknown): char is Quote => {
  return char === Quote.Double || char === Quote.Single;
};

/**
 * Checks whether a character is an opening bracket or quote.
 */
export const isOpeningCharacter = (char: unknown): char is OpeningCharacter => {
  return isString(char) && ALL_OPENING_CHARS.includes(char as never);
};

/**
 * Checks whether a character is a closing bracket or quote.
 */
export const isClosingCharacter = (char: unknown): char is ClosingCharacter => {
  return isString(char) && ALL_CLOSING_CHARS.includes(char as never);
};

/**
 * Checks whether a given character is a valid auto-pair character.
 */
export const isMatchingCharacter = (char: unknown): char is Character => {
  return isString(char) && ALL_AUTOPAIR_CHARS.includes(char as never);
};

/**
 * Determines if two characters form a valid auto-pair.
 *
 * @param charBefore - Character before the cursor.
 * @param charAfter - Character after the cursor.
 * @returns Whether the pair is a valid open-close combination.
 */
export const isMatchingPair = (charBefore: unknown, charAfter: unknown): boolean => {
  const openingMatch = isOpeningCharacter(charBefore);
  const charAfterMatches = isClosingCharacter(charAfter);
  const isPair = openingMatch && charAfterMatches;
  return isPair && getClosingCharacter(charBefore) === charAfter;
};

/**
 * Returns the expected closing character for a given opening character.
 *
 * @param char - The opening character.
 * @returns The corresponding closing character, or `undefined` if no match.
 */
export const getClosingCharacter = (char: OpeningCharacter): ClosingCharacter | undefined => {
  return (OPEN_CLOSE_MAPPING as never)[char];
};
