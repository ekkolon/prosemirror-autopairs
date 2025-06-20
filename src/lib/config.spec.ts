import { describe, expect, it } from 'vitest';
import {
  ALL_AUTOPAIR_CHARS,
  AUTOPAIR_CHAR_GROUPS,
  AutopairGroup,
} from './chars';
import {
  AutopairsOptions,
  defaultConfig,
  resolveCharsToHandle,
} from './config';

describe('resolveCharsToHandle', () => {
  it('returns all characters if no options are passed', () => {
    const result = resolveCharsToHandle();
    expect(result).toEqual(ALL_AUTOPAIR_CHARS);
  });

  it('returns all characters if empty options object is passed', () => {
    const result = resolveCharsToHandle({});
    expect(result).toEqual(ALL_AUTOPAIR_CHARS);
  });

  it('returns only enabled groups from partial config', () => {
    const options: AutopairsOptions = {
      angleBrackets: true,
      singleQuotes: true,
    };

    const expected = [
      ...AUTOPAIR_CHAR_GROUPS[AutopairGroup.AngleBrackets],
      ...AUTOPAIR_CHAR_GROUPS[AutopairGroup.SingleQuotes],
    ];

    const result = resolveCharsToHandle(options);
    expect(result).toEqual(expected);
  });

  it('ignores disabled groups in config', () => {
    const options: AutopairsOptions = {
      angleBrackets: true,
      curlyBrackets: false,
      doubleQuotes: false,
    };

    const expected = AUTOPAIR_CHAR_GROUPS[AutopairGroup.AngleBrackets];
    const result = resolveCharsToHandle(options);

    expect(result).toEqual(expected);
  });

  it('returns empty array if all options are false', () => {
    const allDisabled: AutopairsOptions = {
      angleBrackets: false,
      curlyBrackets: false,
      doubleQuotes: false,
      singleQuotes: false,
      roundBrackets: false,
      squareBrackets: false,
    };

    const result = resolveCharsToHandle(allDisabled);
    expect(result).toEqual([]);
  });
});

describe('defaultConfig', () => {
  it('enables all autopair groups', () => {
    expect(defaultConfig).toEqual({
      angleBrackets: true,
      curlyBrackets: true,
      roundBrackets: true,
      squareBrackets: true,
      doubleQuotes: true,
      singleQuotes: true,
    });
  });

  it('includes all groups used in AUTOPAIR_CHAR_GROUPS', () => {
    const groupKeys = Object.keys(AUTOPAIR_CHAR_GROUPS).sort();
    const configKeys = Object.keys(defaultConfig).sort();
    expect(configKeys).toEqual(groupKeys);
  });
});
