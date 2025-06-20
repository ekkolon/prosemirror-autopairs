export {
  AutopairGroup as BracketCharGroup,
  Bracket as Brackets,
  Char,
  AutopairGroup as CharGroup,
  ClosingBracket,
  ClosingChar,
  findClosingMatch,
  findOpeningMatch,
  resolveCharGroup as getCharsForGroup,
  isCharGroup,
  isClosingChar,
  isAutopairChar as isMatchingChar,
  isMatchingPair as isMatchingPair,
  isOpeningChar,
  isQuoteChar as isQuote,
  OpeningBracket,
  OpeningChar,
  Quote,
} from './lib/chars';
export { AutopairsOptions } from './lib/config';
export {
  AutopairKeyBindings as AutopairKeymap,
  AutopairKeyBindingCommandFactory as AutopairKeymapCommandFactory,
  AutopairKeyBindingsConfig as AutopairKeymapConfig,
  KeyboardKey,
} from './lib/keymap';
