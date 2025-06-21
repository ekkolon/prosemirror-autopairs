import {
  ALL_AUTOPAIR_CHARS,
  ClosingBracket,
  getClosingCharacter,
  isClosingCharacter,
  isMatchingCharacter,
  isMatchingPair,
  isOpeningCharacter,
  isQuote,
  OpeningBracket,
  Quote,
} from './pairs';

describe('autopairs module', () => {
  describe('char matching', () => {
    it('should return correct closing match for brackets', () => {
      expect(getClosingCharacter(OpeningBracket.Round)).toBe(ClosingBracket.Round);
      expect(getClosingCharacter(OpeningBracket.Square)).toBe(ClosingBracket.Square);
      expect(getClosingCharacter(OpeningBracket.Curly)).toBe(ClosingBracket.Curly);
      expect(getClosingCharacter(OpeningBracket.Angle)).toBe(ClosingBracket.Angle);
    });

    it('should return correct closing match for quotes', () => {
      expect(getClosingCharacter(Quote.Double)).toBe(Quote.Double);
      expect(getClosingCharacter(Quote.Single)).toBe(Quote.Single);
    });

    it('should return undefined for invalid input', () => {
      expect(getClosingCharacter('x' as never)).toBeUndefined();
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
      expect(isQuote(Quote.Double)).toBe(true);
      expect(isQuote(Quote.Single)).toBe(true);
      expect(isQuote('(')).toBe(false);
    });

    it('should identify opening characters', () => {
      expect(isOpeningCharacter('{')).toBe(true);
      expect(isOpeningCharacter('(')).toBe(true);
      expect(isOpeningCharacter('"')).toBe(true);
      expect(isOpeningCharacter('z')).toBe(false);
    });

    it('should identify closing characters', () => {
      expect(isClosingCharacter('}')).toBe(true);
      expect(isClosingCharacter(')')).toBe(true);
      expect(isClosingCharacter("'")).toBe(true);
      expect(isClosingCharacter('a')).toBe(false);
    });

    it('should identify matching characters', () => {
      for (const char of ALL_AUTOPAIR_CHARS) {
        expect(isMatchingCharacter(char)).toBe(true);
      }
      expect(isMatchingCharacter('X')).toBe(false);
    });
  });
});
