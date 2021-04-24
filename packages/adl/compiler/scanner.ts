import {
  CharCode,
  isAsciiIdentifierContinue,
  isAsciiIdentifierStart,
  isBinaryDigit,
  isDigit,
  isHexDigit,
  isIdentifierContinue,
  isLineBreak,
  isNonAsciiIdentifierContinue,
  isNonAsciiIdentifierStart,
  isWhiteSpaceSingleLine,
} from "./charcode.js";
import { createSourceFile, Message, throwOnError } from "./diagnostics.js";
import { SourceFile } from "./types.js";

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = 7;

export enum Token {
  None = 0,
  Invalid = 1,
  EndOfFile = 2,

  // Trivia
  SingleLineComment = 3,
  MultiLineComment = 4,
  NewLine = 5,
  Whitespace = 6,

  // We detect and provide better error recovery when we encounter a git merge marker.  This
  // allows us to edit files with git-conflict markers in them in a much more pleasant manner.
  ConflictMarker = 7,

  // Literals
  NumericLiteral = 8,
  StringLiteral = 9,

  // Punctuation
  OpenBrace = 10,
  CloseBrace = 11,
  OpenParen = 12,
  CloseParen = 13,
  OpenBracket = 14,
  CloseBracket = 15,
  Dot = 16,
  Elipsis = 17,
  Semicolon = 18,
  Comma = 19,
  LessThan = 20,
  GreaterThan = 21,
  Equals = 22,
  Ampersand = 23,
  Bar = 24,
  Question = 25,
  Colon = 26,
  At = 27,

  // Identifiers
  Identifier = 28,

  // Statement Keywords
  ImportKeyword = 29,
  ModelKeyword = 30,
  NamespaceKeyword = 31,
  UsingKeyword = 32,
  OpKeyword = 33,

  // Other keywords
  ExtendsKeyword = 34,
  TrueKeyword = 35,
  FalseKeyword = 36,
}

const MinKeyword = Token.ImportKeyword;
const MaxKeyword = Token.FalseKeyword;

const MinPunctuation = Token.OpenBrace;
const MaxPunctuation = Token.At;

const MinStatementKeyword = Token.ImportKeyword;
const MaxStatementKeyword = Token.OpKeyword;

export const TokenDisplay: readonly string[] = [
  "<none>",
  "<invalid>",
  "<end of file>",
  "<single-line comment>",
  "<multi-line comment>",
  "<newline>",
  "<whitespace>",
  "<conflict marker>",
  "<numeric literal>",
  "<string literal>",
  "'{'",
  "'}'",
  "'('",
  "')'",
  "'['",
  "']'",
  "'.'",
  "'...'",
  "';'",
  "','",
  "'<'",
  "'>'",
  "'='",
  "'&'",
  "'|'",
  "'?'",
  "':'",
  "'@'",
  "<identifier>",
  "'import'",
  "'model'",
  "'namespace'",
  "'using'",
  "'op'",
  "'extends'",
  "'true'",
  "'false'",
];

export const Keywords: ReadonlyMap<string, Token> = new Map([
  ["import", Token.ImportKeyword],
  ["model", Token.ModelKeyword],
  ["namespace", Token.NamespaceKeyword],
  ["using", Token.UsingKeyword],
  ["op", Token.OpKeyword],
  ["extends", Token.ExtendsKeyword],
  ["true", Token.TrueKeyword],
  ["false", Token.FalseKeyword],
]);

export const maxKeywordLength = 9;

export interface Scanner {
  /** The source code being scanned. */
  readonly file: SourceFile;

  /** The offset in UTF-16 code units to the current position at the start of the next token. */
  readonly position: number;

  /** The current token */
  readonly token: Token;

  /** The offset in UTF-16 code units to the start of the current token. */
  readonly tokenPosition: number;

  /** Advance one token. */
  scan(): Token;

  /** Determine if the scanner has reached the end of the input. */
  eof(): boolean;

  /** The exact spelling of the current token. */
  getTokenText(): string;

  /**
   * The value of the current token.
   *
   * Currently differs from tokenText() only for string literals, which are
   * unescaped and unquoted to the represented string value.
   */
  getTokenValue(): string;
}

const enum TokenFlags {
  None = 0,
  HasCrlf = 1 << 0,
  Escaped = 1 << 1,
  TripleQuoted = 1 << 2,
}

export function isLiteral(token: Token) {
  return (
    token === Token.NumericLiteral ||
    token === Token.StringLiteral ||
    token === Token.TrueKeyword ||
    token === Token.FalseKeyword
  );
}

export function isTrivia(token: Token) {
  return (
    token === Token.Whitespace ||
    token === Token.NewLine ||
    token === Token.SingleLineComment ||
    token === Token.MultiLineComment
  );
}

export function isKeyword(token: Token) {
  return token >= MinKeyword && token <= MaxKeyword;
}

export function isPunctuation(token: Token) {
  return token >= MinPunctuation && token <= MaxPunctuation;
}

export function isStatementKeyword(token: Token) {
  return token >= MinStatementKeyword && token <= MaxStatementKeyword;
}

export function createScanner(source: string | SourceFile, onError = throwOnError): Scanner {
  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;
  const input = file.text;
  let position = 0;
  let token = Token.Invalid;
  let tokenPosition = -1;
  let tokenValue: string | undefined = undefined;
  let tokenFlags = TokenFlags.None;

  return {
    get position() {
      return position;
    },
    get token() {
      return token;
    },
    get tokenPosition() {
      return tokenPosition;
    },
    file,
    scan,
    eof,
    getTokenText,
    getTokenValue,
  };

  function eof() {
    return position >= input.length;
  }

  function next(t: Token, count = 1) {
    position += count;
    return (token = t);
  }

  function utf16CodeUnits(codePoint: number) {
    return codePoint >= 0x10000 ? 2 : 1;
  }

  function getTokenText() {
    return input.substring(tokenPosition, position);
  }

  function lookAhead(offset: number) {
    return input.charCodeAt(position + offset);
  }

  function scan(): Token {
    tokenPosition = position;
    tokenValue = undefined;
    tokenFlags = TokenFlags.None;

    if (!eof()) {
      const ch = input.charCodeAt(position);
      switch (ch) {
        case CharCode.CarriageReturn:
          if (lookAhead(1) === CharCode.LineFeed) {
            position++;
          }
        // fallthrough
        case CharCode.LineFeed:
        case CharCode.LineSeparator:
        case CharCode.ParagraphSeparator:
          return next(Token.NewLine);

        case CharCode.Tab:
        case CharCode.VerticalTab:
        case CharCode.FormFeed:
        case CharCode.Space:
        case CharCode.NonBreakingSpace:
        case CharCode.Ogham:
        case CharCode.EnQuad:
        case CharCode.EmQuad:
        case CharCode.EnSpace:
        case CharCode.EmSpace:
        case CharCode.ThreePerEmSpace:
        case CharCode.FourPerEmSpace:
        case CharCode.SixPerEmSpace:
        case CharCode.FigureSpace:
        case CharCode.PunctuationSpace:
        case CharCode.ThinSpace:
        case CharCode.HairSpace:
        case CharCode.ZeroWidthSpace:
        case CharCode.NarrowNoBreakSpace:
        case CharCode.MathematicalSpace:
        case CharCode.IdeographicSpace:
        case CharCode.ByteOrderMark:
          return scanWhitespace();

        case CharCode.OpenParen:
          return next(Token.OpenParen);

        case CharCode.CloseParen:
          return next(Token.CloseParen);

        case CharCode.Comma:
          return next(Token.Comma);

        case CharCode.Colon:
          return next(Token.Colon);

        case CharCode.Semicolon:
          return next(Token.Semicolon);

        case CharCode.OpenBracket:
          return next(Token.OpenBracket);

        case CharCode.CloseBracket:
          return next(Token.CloseBracket);

        case CharCode.OpenBrace:
          return next(Token.OpenBrace);

        case CharCode.CloseBrace:
          return next(Token.CloseBrace);

        case CharCode.At:
          return next(Token.At);

        case CharCode.Question:
          return next(Token.Question);

        case CharCode.Ampersand:
          return next(Token.Ampersand);

        case CharCode.Dot:
          return lookAhead(1) === CharCode.Dot && lookAhead(2) === CharCode.Dot
            ? next(Token.Elipsis, 3)
            : next(Token.Dot);

        case CharCode.Slash:
          switch (lookAhead(1)) {
            case CharCode.Slash:
              return scanSingleLineComment();
            case CharCode.Asterisk:
              return scanMultiLineComment();
          }
          return scanInvalidCharacter();

        case CharCode._0:
          switch (lookAhead(1)) {
            case CharCode.x:
              return scanHexNumber();
            case CharCode.b:
              return scanBinaryNumber();
          }
        // fallthrough
        case CharCode._1:
        case CharCode._2:
        case CharCode._3:
        case CharCode._4:
        case CharCode._5:
        case CharCode._6:
        case CharCode._7:
        case CharCode._8:
        case CharCode._9:
          return scanNumber();

        case CharCode.LessThan:
          return isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.LessThan);

        case CharCode.GreaterThan:
          return isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.GreaterThan);

        case CharCode.Equals:
          return isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.Equals);

        case CharCode.Bar:
          return isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.Bar);

        case CharCode.DoubleQuote:
          return scanString();

        default:
          return scanIdentifierOrKeyword();
      }
    }

    return (token = Token.EndOfFile);
  }

  function scanInvalidCharacter() {
    const codePoint = input.codePointAt(position)!;
    token = next(Token.Invalid, utf16CodeUnits(codePoint));
    error(Message.InvalidCharacter);
    return token;
  }

  function isConflictMarker() {
    // Conflict markers must be at the start of a line.
    const ch = input.charCodeAt(position);
    if (position === 0 || isLineBreak(input.charCodeAt(position - 1))) {
      if (position + mergeConflictMarkerLength < input.length) {
        for (let i = 0; i < mergeConflictMarkerLength; i++) {
          if (lookAhead(i) !== ch) {
            return false;
          }
        }
        return ch === CharCode.Equals || lookAhead(mergeConflictMarkerLength) === CharCode.Space;
      }
    }

    return false;
  }

  function error(msg: Message, args?: (string | number)[]) {
    onError(msg, { file, pos: tokenPosition, end: position }, args);
  }

  function scanWhitespace(): Token {
    do {
      position++;
    } while (isWhiteSpaceSingleLine(input.charCodeAt(position)));

    return (token = Token.Whitespace);
  }

  function scanDigits() {
    while (isDigit(input.charCodeAt(position))) {
      position++;
    }
  }

  function scanNumber() {
    scanDigits();

    let ch = input.charCodeAt(position);

    if (ch === CharCode.Dot) {
      position++;
      scanDigits();
    }

    ch = input.charCodeAt(position);
    if (ch === CharCode.e) {
      position++;
      ch = input.charCodeAt(position);
      if (ch === CharCode.Plus || ch == CharCode.Minus) {
        position++;
        ch = input.charCodeAt(position);
      }

      if (isDigit(ch)) {
        position++;
        scanDigits();
      } else {
        error(Message.DigitExpected);
      }
    }

    return (token = Token.NumericLiteral);
  }

  function scanHexNumber() {
    if (!isHexDigit(lookAhead(2))) {
      error(Message.HexDigitExpected);
      return next(Token.NumericLiteral, 2);
    }

    position += 2;
    scanUntil((ch) => !isHexDigit(ch), "Hex Digit");
    return (token = Token.NumericLiteral);
  }

  function scanBinaryNumber() {
    if (!isBinaryDigit(lookAhead(2))) {
      error(Message.BinaryDigitExpected);
      return next(Token.NumericLiteral, 2);
    }

    position += 2;
    scanUntil((ch) => !isBinaryDigit(ch), "Binary Digit");
    return (token = Token.NumericLiteral);
  }

  function scanUntil(
    predicate: (char: number) => boolean,
    expectedClose?: string,
    consumeClose?: number
  ) {
    let ch: number;

    do {
      position++;

      if (eof()) {
        if (expectedClose) {
          error(Message.UnexpectedEndOfFile, [expectedClose]);
        }
        break;
      }

      ch = input.charCodeAt(position);
    } while (!predicate(ch));

    if (consumeClose) {
      position += consumeClose;
    }
  }

  function scanSingleLineComment() {
    scanUntil(isLineBreak);
    return (token = Token.SingleLineComment);
  }

  function scanMultiLineComment() {
    scanUntil((ch) => ch === CharCode.Asterisk && lookAhead(1) === CharCode.Slash, "*/", 2);
    return (token = Token.MultiLineComment);
  }

  function scanString() {
    let quoteLength = 1;
    let closing = '"';
    let isEscaping = false;

    const tripleQuoted =
      lookAhead(1) === CharCode.DoubleQuote && lookAhead(2) === CharCode.DoubleQuote;

    if (tripleQuoted) {
      tokenFlags |= TokenFlags.TripleQuoted;
      quoteLength = 3;
      position += 2;
      closing = '"""';
    }

    scanUntil(
      (ch) => {
        if (isEscaping) {
          isEscaping = false;
          return false;
        }

        switch (ch) {
          case CharCode.CarriageReturn:
            if (lookAhead(1) === CharCode.LineFeed) {
              tokenFlags |= TokenFlags.HasCrlf;
            }
            return false;

          case CharCode.Backslash:
            isEscaping = true;
            tokenFlags |= TokenFlags.Escaped;
            return false;

          case CharCode.DoubleQuote:
            if (tripleQuoted) {
              return lookAhead(1) === CharCode.DoubleQuote && lookAhead(2) === CharCode.DoubleQuote;
            }
            return true;

          default:
            return false;
        }
      },
      closing,
      quoteLength
    );

    return (token = Token.StringLiteral);
  }

  function getTokenValue() {
    if (tokenValue !== undefined) {
      return tokenValue;
    }

    if (token !== Token.StringLiteral) {
      return (tokenValue = getTokenText());
    }

    // strip quotes
    const quoteLength = tokenFlags & TokenFlags.TripleQuoted ? 3 : 1;
    let value = input.substring(tokenPosition + quoteLength, position - quoteLength);

    // Normalize CRLF to LF when interpreting value of multi-line string
    // literals. Matches JavaScript behavior and ensures program behavior does
    // not change due to line-ending conversion.
    if (tokenFlags & TokenFlags.HasCrlf) {
      value = value.replace(/\r\n/g, "\n");
    }

    if (tokenFlags & TokenFlags.TripleQuoted) {
      value = unindentTripleQuoteString(value);
    }

    if (tokenFlags & TokenFlags.Escaped) {
      value = unescapeString(value);
    }

    return (tokenValue = value);
  }

  function unindentTripleQuoteString(text: string) {
    let start = 0;
    let end = text.length;

    // ignore leading whitespace before required initial line break
    while (start < end && isWhiteSpaceSingleLine(text.charCodeAt(start))) {
      start++;
    }

    // remove required initial line break
    if (isLineBreak(text.charCodeAt(start))) {
      start++;
    } else {
      error(Message.NoNewLineAtStartOfTripleQuotedString);
    }

    // remove whitespace before closing delimiter and record it as
    // required indentation for all lines.
    while (end > start && isWhiteSpaceSingleLine(text.charCodeAt(end - 1))) {
      end--;
    }
    const indentation = text.substring(end, text.length);

    // remove required final line break
    if (isLineBreak(text.charCodeAt(end - 1))) {
      end--;
    } else {
      error(Message.NoNewLineAtEndOfTripleQuotedString);
    }

    // remove required matching indentation from each line
    return removeMatchingIndentation(text, start, end, indentation);
  }

  function removeMatchingIndentation(
    text: string,
    start: number,
    end: number,
    indentation: string
  ) {
    let result = "";
    let pos = start;

    while (pos < end) {
      start = skipMatchingIndentation(text, pos, end, indentation);
      while (pos < end && !isLineBreak(text.charCodeAt(pos))) {
        pos++;
      }
      if (pos < end) {
        pos++; // include line break
      }
      result += text.substring(start, pos);
    }

    return result;
  }

  function skipMatchingIndentation(text: string, pos: number, end: number, indentation: string) {
    end = Math.min(end, pos + indentation.length);

    let indentationPos = 0;
    while (pos < end) {
      const ch = text.charCodeAt(pos);
      if (isLineBreak(ch)) {
        // allow subset of indentation if line has only whitespace
        break;
      }
      if (ch != indentation.charCodeAt(indentationPos)) {
        error(Message.InconsistentTripleQuoteIndentation);
        break;
      }
      indentationPos++;
      pos++;
    }

    return pos;
  }

  function unescapeString(text: string) {
    let result = "";
    let start = 0;
    let pos = 0;
    const end = text.length;

    while (pos < end) {
      let ch = text.charCodeAt(pos);
      if (ch != CharCode.Backslash) {
        pos++;
        continue;
      }

      result += text.substring(start, pos);
      pos++;
      ch = text.charCodeAt(pos);

      switch (ch) {
        case CharCode.r:
          result += "\r";
          break;
        case CharCode.n:
          result += "\n";
          break;
        case CharCode.t:
          result += "\t";
          break;
        case CharCode.DoubleQuote:
          result += '"';
          break;
        case CharCode.Backslash:
          result += "\\";
          break;
        default:
          error(Message.InvalidEscapeSequence);
          result += String.fromCharCode(ch);
          break;
      }

      pos++;
      start = pos;
    }

    result += text.substring(start, pos);
    return result;
  }

  function scanIdentifierOrKeyword() {
    let ch = input.charCodeAt(position);

    if (!isAsciiIdentifierStart(ch)) {
      return scanNonAsciiIdentifier();
    }

    do {
      position++;
      if (eof()) {
        break;
      }
      ch = input.charCodeAt(position);
    } while (isAsciiIdentifierContinue(ch));

    if (!eof() && ch > CharCode.MaxAscii) {
      const codePoint = input.codePointAt(position)!;
      if (isNonAsciiIdentifierContinue(codePoint)) {
        return scanNonAsciiIdentifierContinue(codePoint);
      }
    }

    if (position - tokenPosition <= maxKeywordLength) {
      const value = getTokenValue();
      const keyword = Keywords.get(value);
      if (keyword) {
        return (token = keyword);
      }
    }

    return (token = Token.Identifier);
  }

  function scanNonAsciiIdentifier() {
    let codePoint = input.codePointAt(position)!;
    return isNonAsciiIdentifierStart(codePoint)
      ? scanNonAsciiIdentifierContinue(codePoint)
      : scanInvalidCharacter();
  }

  function scanNonAsciiIdentifierContinue(startCodePoint: number) {
    let codePoint = startCodePoint;

    do {
      position += utf16CodeUnits(codePoint);
      if (eof()) {
        break;
      }
      codePoint = input.codePointAt(position)!;
    } while (isIdentifierContinue(codePoint));

    return (token = Token.Identifier);
  }
}
