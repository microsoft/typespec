import { nonAsciiIdentifierContinueMap, nonAsciiIdentifierStartMap } from "./nonascii.js";

export const enum CharacterCodes {
  nullCharacter = 0,
  maxAsciiCharacter = 0x7f,

  lineFeed = 0x0a,
  carriageReturn = 0x0d,
  lineSeparator = 0x2028,
  paragraphSeparator = 0x2029,
  nextLine = 0x0085,

  // Unicode 3.0 space characters
  space = 0x0020,
  nonBreakingSpace = 0x00a0,
  enQuad = 0x2000,
  emQuad = 0x2001,
  enSpace = 0x2002,
  emSpace = 0x2003,
  threePerEmSpace = 0x2004,
  fourPerEmSpace = 0x2005,
  sixPerEmSpace = 0x2006,
  figureSpace = 0x2007,
  punctuationSpace = 0x2008,
  thinSpace = 0x2009,
  hairSpace = 0x200a,
  zeroWidthSpace = 0x200b,
  narrowNoBreakSpace = 0x202f,
  ideographicSpace = 0x3000,
  mathematicalSpace = 0x205f,
  ogham = 0x1680,

  _ = 0x5f,
  $ = 0x24,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6a,
  k = 0x6b,
  l = 0x6c,
  m = 0x6d,
  n = 0x6e,
  o = 0x6f,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7a,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4a,
  K = 0x4b,
  L = 0x4c,
  M = 0x4d,
  N = 0x4e,
  O = 0x4f,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  ampersand = 0x26,
  asterisk = 0x2a,
  at = 0x40,
  backslash = 0x5c,
  backtick = 0x60,
  bar = 0x7c,
  caret = 0x5e,
  closeBrace = 0x7d,
  closeBracket = 0x5d,
  closeParen = 0x29,
  colon = 0x3a,
  comma = 0x2c,
  dot = 0x2e,
  doubleQuote = 0x22,
  equals = 0x3d,
  exclamation = 0x21,
  greaterThan = 0x3e,
  hash = 0x23,
  lessThan = 0x3c,
  minus = 0x2d,
  openBrace = 0x7b,
  openBracket = 0x5b,
  openParen = 0x28,
  percent = 0x25,
  plus = 0x2b,
  question = 0x3f,
  semicolon = 0x3b,
  singleQuote = 0x27,
  slash = 0x2f,
  tilde = 0x7e,

  backspace = 0x08,
  formFeed = 0x0c,
  byteOrderMark = 0xfeff,
  tab = 0x09,
  verticalTab = 0x0b,
}

/** Does not include line breaks. For that, see isWhiteSpaceLike. */
export function isWhiteSpaceSingleLine(ch: number): boolean {
  // Note: nextLine is in the Zs space, and should be considered to be a whitespace.
  // It is explicitly not a line-break as it isn't in the exact set specified by EcmaScript.
  return (
    ch === CharacterCodes.space ||
    ch === CharacterCodes.tab ||
    ch === CharacterCodes.verticalTab ||
    ch === CharacterCodes.formFeed ||
    ch === CharacterCodes.nonBreakingSpace ||
    ch === CharacterCodes.nextLine ||
    ch === CharacterCodes.ogham ||
    (ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace) ||
    ch === CharacterCodes.narrowNoBreakSpace ||
    ch === CharacterCodes.mathematicalSpace ||
    ch === CharacterCodes.ideographicSpace ||
    ch === CharacterCodes.byteOrderMark
  );
}

export function isLineBreak(ch: number): boolean {
  // Other new line or line
  // breaking characters are treated as white space but not as line terminators.
  return (
    ch === CharacterCodes.lineFeed ||
    ch === CharacterCodes.carriageReturn ||
    ch === CharacterCodes.lineSeparator ||
    ch === CharacterCodes.paragraphSeparator
  );
}

export function isDigit(ch: number): boolean {
  return ch >= CharacterCodes._0 && ch <= CharacterCodes._9;
}

export function isHexDigit(ch: number): boolean {
  return (
    isDigit(ch) ||
    (ch >= CharacterCodes.A && ch <= CharacterCodes.F) ||
    (ch >= CharacterCodes.a && ch <= CharacterCodes.f)
  );
}

export function isBinaryDigit(ch: number): boolean {
  return ch === CharacterCodes._0 || ch === CharacterCodes._1;
}

export function isAsciiIdentifierStart(ch: number): boolean {
  return (
    (ch >= CharacterCodes.A && ch <= CharacterCodes.Z) ||
    (ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
    ch === CharacterCodes.$ ||
    ch === CharacterCodes._
  );
}

export function isAsciiIdentifierContinue(ch: number): boolean {
  return (
    (ch >= CharacterCodes.A && ch <= CharacterCodes.Z) ||
    (ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
    (ch >= CharacterCodes._0 && ch <= CharacterCodes._9) ||
    ch === CharacterCodes.$ ||
    ch === CharacterCodes._
  );
}

export function isIdentifierContinue(codePoint: number) {
  return (
    isAsciiIdentifierStart(codePoint) ||
    (codePoint > CharacterCodes.maxAsciiCharacter && isNonAsciiIdentifierContinue(codePoint))
  );
}

export function isNonAsciiIdentifierStart(codePoint: number) {
  return lookupInNonAsciiMap(codePoint, nonAsciiIdentifierStartMap);
}

export function isNonAsciiIdentifierContinue(codePoint: number) {
  return lookupInNonAsciiMap(codePoint, nonAsciiIdentifierContinueMap);
}

function lookupInNonAsciiMap(codePoint: number, map: readonly number[]): boolean {
  // Bail out quickly if it couldn't possibly be in the map.
  if (codePoint < map[0]) {
    return false;
  }

  // Perform binary search in one of the Unicode range maps
  let lo = 0;
  let hi: number = map.length;
  let mid: number;

  while (lo + 1 < hi) {
    mid = lo + (hi - lo) / 2;
    // mid has to be even to catch a range's beginning
    mid -= mid % 2;
    if (map[mid] <= codePoint && codePoint <= map[mid + 1]) {
      return true;
    }

    if (codePoint < map[mid]) {
      hi = mid;
    } else {
      lo = mid + 2;
    }
  }

  return false;
}
