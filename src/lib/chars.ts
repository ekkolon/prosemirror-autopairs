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
export type OpeningChar = OpeningBracket | Quote;

/**
 * Union type of all closing characters (brackets and quotes).
 */
export type ClosingChar = ClosingBracket | Quote;

/**
 * Union type of all auto-pair characters (opening or closing).
 */
export type Char = OpeningChar | ClosingChar;

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
 * @internal
 * Mapping of character groups to their associated characters.
 */
export const AUTOPAIR_CHAR_GROUPS = {
  [AutopairGroup.AngleBrackets]: [OpeningBracket.Angle, ClosingBracket.Angle],
  [AutopairGroup.CurlyBrackets]: [OpeningBracket.Curly, ClosingBracket.Curly],
  [AutopairGroup.RoundBrackets]: [OpeningBracket.Round, ClosingBracket.Round],
  [AutopairGroup.SquareBrackets]: [
    OpeningBracket.Square,
    ClosingBracket.Square,
  ],
  [AutopairGroup.DoubleQuotes]: [Quote.Double],
  [AutopairGroup.SingleQuotes]: [Quote.Single],
};

const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * @internal
 * Checks whether a value is a valid `CharGroup`.
 * @param group - Input to test.
 * @returns Whether the input is a valid `CharGroup`.
 */
export const isCharGroup = (group: unknown): group is AutopairGroup => {
  return isString(group) && group in AUTOPAIR_CHAR_GROUPS;
};

/**
 * @internal
 * Retrieves all characters associated with a `CharGroup`.
 *
 * @throws If the input is not a valid `CharGroup`.
 */
export const resolveCharGroup = (group: unknown): Char[] => {
  if (!isCharGroup(group)) {
    throw new Error(`Invalid auto-pair char group: ${group}`);
  }
  return AUTOPAIR_CHAR_GROUPS[group];
};

/**
 * Check whether a character is a quote (single or double).
 */
export const isQuoteChar = (char: unknown): char is Quote => {
  return char === Quote.Double || char === Quote.Single;
};

/**
 * @internal
 * Maps opening characters to their corresponding closing characters.
 */
export const AUTOPAIR_CHAR_MAP: Record<OpeningChar, ClosingChar> = {
  [OpeningBracket.Angle]: ClosingBracket.Angle,
  [OpeningBracket.Curly]: ClosingBracket.Curly,
  [OpeningBracket.Round]: ClosingBracket.Round,
  [OpeningBracket.Square]: ClosingBracket.Square,
  [Quote.Double]: Quote.Double,
  [Quote.Single]: Quote.Single,
};

/**
 * @internal
 * Flat list of all auto-pair characters (opening and closing).
 */
export const ALL_AUTOPAIR_CHARS = [
  ...Object.keys(AUTOPAIR_CHAR_MAP),
  ...Object.values(AUTOPAIR_CHAR_MAP),
] as Char[];

/**
 * Checks whether a character is an opening bracket or quote.
 * @param char - Character to test.
 * @returns Whether the character is an opening character.
 */
export const isOpeningChar = (char: unknown): char is OpeningChar => {
  return isString(char) && ALL_AUTOPAIR_CHARS.includes(char as Char);
};

/**
 * Checks whether a character is a closing bracket or quote.
 */
export const isClosingChar = (char: unknown): char is ClosingChar => {
  return isString(char) && ALL_AUTOPAIR_CHARS.includes(char as Char);
};

/**
 * Checks whether a character is an auto-pair character (either opening or closing).
 */
export const isAutopairChar = (char: unknown): char is Char => {
  return isString(char) && ALL_AUTOPAIR_CHARS.includes(char as Char);
};

/**
 * Determines if two characters form a valid auto-pair.
 *
 * @param charBefore - Character before the cursor.
 * @param charAfter - Character after the cursor.
 * @returns Whether the pair is a valid open-close combination.
 */
export const isMatchingPair = (
  charBefore: unknown,
  charAfter: unknown,
): boolean => {
  const openingMatch = isOpeningChar(charBefore);
  const charAfterMatches = isClosingChar(charAfter);
  const isPair = openingMatch && charAfterMatches;
  return isPair && findClosingMatch(charBefore) === charAfter;
};

/**
 * Returns the expected closing character for a given opening character.
 *
 * @param char - The opening character.
 * @returns The corresponding closing character, or `undefined` if no match.
 */
export const findClosingMatch = (
  char: OpeningChar,
): ClosingChar | undefined => {
  return (AUTOPAIR_CHAR_MAP as Partial<typeof AUTOPAIR_CHAR_MAP>)[char];
};

/**
 * Returns the expected opening character for a given closing character.
 * This performs a reverse lookup from the internal mapping.
 *
 * @param closingChar - The closing character.
 * @returns The corresponding opening character, or `undefined` if not found.
 */
export const findOpeningMatch = (
  closingChar: ClosingChar,
): OpeningChar | undefined => {
  const entries = Object.entries(AUTOPAIR_CHAR_MAP) as [
    OpeningChar,
    ClosingChar,
  ][];
  const entry = entries.find(([, closing]) => closing === closingChar);
  return entry?.[0];
};
