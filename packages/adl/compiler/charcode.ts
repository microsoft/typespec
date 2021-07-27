import { nonAsciiIdentifierMap } from "./nonascii.js";

export const enum CharCode {
  Null = 0x00,
  MaxAscii = 0x7f,
  ByteOrderMark = 0xfeff,

  // Line breaks
  LineFeed = 0x0a,
  CarriageReturn = 0x0d,

  // ASCII whitespace excluding line breaks
  Space = 0x20,
  Tab = 0x09,
  VerticalTab = 0x0b,
  FormFeed = 0x0c,

  // Non-ASCII whitespace excluding line breaks
  NextLine = 0x0085, // not considered a line break
  LeftToRightMark = 0x200e,
  RightToLeftMark = 0x200f,
  LineSeparator = 0x2028,
  ParagraphSeparator = 0x2029,

  // ASCII Digits
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

  // ASCII lowercase letters
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

  // ASCII uppercase letters
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

  // Non-letter, non-digit ASCII characters that are valid in identifiers
  _ = 0x5f,
  $ = 0x24,

  // ASCII punctuation
  Ampersand = 0x26,
  Asterisk = 0x2a,
  At = 0x40,
  Backslash = 0x5c,
  Backtick = 0x60,
  Bar = 0x7c,
  Caret = 0x5e,
  CloseBrace = 0x7d,
  CloseBracket = 0x5d,
  CloseParen = 0x29,
  Colon = 0x3a,
  Comma = 0x2c,
  Dot = 0x2e,
  DoubleQuote = 0x22,
  Equals = 0x3d,
  Exclamation = 0x21,
  GreaterThan = 0x3e,
  Hash = 0x23,
  LessThan = 0x3c,
  Minus = 0x2d,
  OpenBrace = 0x7b,
  OpenBracket = 0x5b,
  OpenParen = 0x28,
  Percent = 0x25,
  Plus = 0x2b,
  Question = 0x3f,
  Semicolon = 0x3b,
  SingleQuote = 0x27,
  Slash = 0x2f,
  Tilde = 0x7e,
}

export function utf16CodeUnits(codePoint: number) {
  return codePoint >= 0x10000 ? 2 : 1;
}

export function isLineBreak(ch: number) {
  return ch === CharCode.LineFeed || ch == CharCode.CarriageReturn;
}

export function isAsciiWhiteSpaceSingleLine(ch: number) {
  return (
    ch === CharCode.Space ||
    ch === CharCode.Tab ||
    ch === CharCode.VerticalTab ||
    ch === CharCode.FormFeed
  );
}

export function isNonAsciiWhiteSpaceSingleLine(ch: number) {
  return (
    ch === CharCode.NextLine || // not considered a line break
    ch === CharCode.LeftToRightMark ||
    ch === CharCode.RightToLeftMark ||
    ch === CharCode.LineSeparator ||
    ch === CharCode.ParagraphSeparator
  );
}

export function isWhiteSpaceSingleLine(ch: number) {
  return (
    isAsciiWhiteSpaceSingleLine(ch) ||
    (ch > CharCode.MaxAscii && isNonAsciiWhiteSpaceSingleLine(ch))
  );
}

export function isDigit(ch: number) {
  return ch >= CharCode._0 && ch <= CharCode._9;
}

export function isHexDigit(ch: number) {
  return (
    isDigit(ch) || (ch >= CharCode.A && ch <= CharCode.F) || (ch >= CharCode.a && ch <= CharCode.f)
  );
}

export function isBinaryDigit(ch: number) {
  return ch === CharCode._0 || ch === CharCode._1;
}

export function isLowercaseAsciiLetter(ch: number) {
  return ch >= CharCode.a && ch <= CharCode.z;
}

export function isAsciiIdentifierStart(ch: number) {
  return (
    (ch >= CharCode.A && ch <= CharCode.Z) ||
    (ch >= CharCode.a && ch <= CharCode.z) ||
    ch === CharCode.$ ||
    ch === CharCode._
  );
}

export function isAsciiIdentifierContinue(ch: number) {
  return (
    (ch >= CharCode.A && ch <= CharCode.Z) ||
    (ch >= CharCode.a && ch <= CharCode.z) ||
    (ch >= CharCode._0 && ch <= CharCode._9) ||
    ch === CharCode.$ ||
    ch === CharCode._
  );
}

export function isIdentifierStart(codePoint: number) {
  return (
    isAsciiIdentifierStart(codePoint) ||
    (codePoint > CharCode.MaxAscii && isNonAsciiIdentifierCharacter(codePoint))
  );
}

export function isIdentifierContinue(codePoint: number) {
  return (
    isAsciiIdentifierContinue(codePoint) ||
    (codePoint > CharCode.MaxAscii && isNonAsciiIdentifierCharacter(codePoint))
  );
}

export function isNonAsciiIdentifierCharacter(codePoint: number) {
  return lookupInNonAsciiMap(codePoint, nonAsciiIdentifierMap);
}

function lookupInNonAsciiMap(codePoint: number, map: readonly number[]) {
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
