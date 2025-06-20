import {
  ALL_AUTOPAIR_CHARS,
  AUTOPAIR_CHAR_MAP,
  ClosingBracket,
  OpeningBracket,
  Quote,
  findClosingMatch,
  resolveCharGroup,
  isMatchingPair,
  isAutopairChar,
  isCharGroup,
  isClosingChar,
  isOpeningChar,
  isQuoteChar,
} from './chars';

describe('autopairs module', () => {
  describe('char matching', () => {
    it('should return correct closing match for brackets', () => {
      expect(findClosingMatch(OpeningBracket.Round)).toBe(ClosingBracket.Round);
      expect(findClosingMatch(OpeningBracket.Square)).toBe(
        ClosingBracket.Square,
      );
      expect(findClosingMatch(OpeningBracket.Curly)).toBe(ClosingBracket.Curly);
      expect(findClosingMatch(OpeningBracket.Angle)).toBe(ClosingBracket.Angle);
    });

    it('should return correct closing match for quotes', () => {
      expect(findClosingMatch(Quote.Double)).toBe(Quote.Double);
      expect(findClosingMatch(Quote.Single)).toBe(Quote.Single);
    });

    it('should return undefined for invalid input', () => {
      expect(findClosingMatch('x' as never)).toBeUndefined();
    });

    it('should match correct opening to closing pairs', () => {
      expect(isMatchingPair('(', ')')).toBe(true);
      expect(isMatchingPair('{', '}')).toBe(true);
      expect(isMatchingPair('[', ']')).toBe(true);
      expect(isMatchingPair('<', '>')).toBe(true);
      expect(isMatchingPair('"', '"')).toBe(true);
      expect(isMatchingPair("'", "'")).toBe(true);
    });

    it('should not match mismatched pairs', () => {
      expect(isMatchingPair('(', '}')).toBe(false);
      expect(isMatchingPair('{', ']')).toBe(false);
      expect(isMatchingPair('"', "'")).toBe(false);
    });
  });

  describe('type guards', () => {
    it('should correctly identify quotes', () => {
      expect(isQuoteChar(Quote.Double)).toBe(true);
      expect(isQuoteChar(Quote.Single)).toBe(true);
      expect(isQuoteChar('(')).toBe(false);
    });

    it('should identify opening characters', () => {
      expect(isOpeningChar('{')).toBe(true);
      expect(isOpeningChar('(')).toBe(true);
      expect(isOpeningChar('"')).toBe(true);
      expect(isOpeningChar('z')).toBe(false);
    });

    it('should identify closing characters', () => {
      expect(isClosingChar('}')).toBe(true);
      expect(isClosingChar(')')).toBe(true);
      expect(isClosingChar("'")).toBe(true);
      expect(isClosingChar('a')).toBe(false);
    });

    it('should identify matching characters', () => {
      for (const char of ALL_AUTOPAIR_CHARS) {
        expect(isAutopairChar(char)).toBe(true);
      }
      expect(isAutopairChar('X')).toBe(false);
    });
  });

  describe('char groups', () => {
    it('should return correct chars for each group', () => {
      expect(resolveCharGroup('roundBrackets')).toEqual(['(', ')']);
      expect(resolveCharGroup('curlyBrackets')).toEqual(['{', '}']);

      expect(resolveCharGroup('singleQuotes')).toEqual(["'"]);
      expect(resolveCharGroup('doubleQuotes')).toEqual(['"']);
    });

    it('should validate char groups', () => {
      expect(isCharGroup('roundBrackets')).toBe(true);
      expect(isCharGroup('invalidBrackets')).toBe(false);

      expect(isCharGroup('doubleQuotes')).toBe(true);
      expect(isCharGroup('trippleQuotes')).toBe(false);
    });

    it('should throw for invalid groups', () => {
      expect(() => resolveCharGroup('bogus')).toThrow(
        'Invalid auto-pair char group: bogus',
      );
    });
  });

  describe('constants integrity', () => {
    it('AUTOPAIR_CHAR_LIST should contain all keys and values of CHAR_MAP', () => {
      const mapKeys = Object.keys(AUTOPAIR_CHAR_MAP);
      const mapValues = Object.values(AUTOPAIR_CHAR_MAP);
      for (const char of [...mapKeys, ...mapValues]) {
        expect(ALL_AUTOPAIR_CHARS).toContain(char);
      }
    });

    it('QUOTE_AUTOPAIR_CHAR_LIST should contain both quote types', () => {
      expect(ALL_AUTOPAIR_CHARS).toContain("'");
      expect(ALL_AUTOPAIR_CHARS).toContain('"');
    });
  });
});
