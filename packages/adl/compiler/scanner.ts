import { CharacterCodes, isBinaryDigit, isDigit, isHexDigit, isIdentifierPart, isIdentifierStart, isLineBreak, isWhiteSpaceSingleLine } from './character-codes.js';
import { format, Message, messages } from './messages.js';

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = 7;

export enum Token {
  Unknown,
  EndOfFile,

  SingleLineComment,
  MultiLineComment,
  NewLine,
  Whitespace,

  // We detect and provide better error recovery when we encounter a git merge marker.  This
  // allows us to edit files with git-conflict markers in them in a much more pleasant manner.
  ConflictMarker,

  // Literals
  NumericLiteral,
  StringLiteral,

  // Punctuation
  OpenBrace,
  CloseBrace,
  OpenParen,
  CloseParen,
  OpenBracket,
  CloseBracket,
  Dot,
  Elipsis,
  Semicolon,
  Comma,
  LessThan,
  GreaterThan,
  Equals,
  Ampersand,
  Bar,
  Question,
  Colon,
  At,

  // Identifiers
  Identifier,

  // Keywords
  ImportKeyword,
  ModelKeyword,
  NamespaceKeyword,
  OpKeyword,
  TrueKeyword,
  FalseKeyword
}

const keywords = new Map([
  ['import', Token.ImportKeyword],
  ['model', Token.ModelKeyword],
  ['namespace', Token.NamespaceKeyword],
  ['op', Token.OpKeyword],
  ['true', Token.TrueKeyword],
  ['false', Token.FalseKeyword]
]);

export interface Scanner {
  /** The source code being scanned. */
  readonly input: string;

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

export function throwOnError(msg: Message, params: Array<string | number>) {
  throw new Error(format(msg.text, ...params));
}

const enum TokenFlags {
  HasCrlf = 1 << 0,
  Escaped = 1 << 1,
  TripleQuoted = 1 << 2,
}

export function createScanner(input: string, onError = throwOnError) {
  let position = 0;
  let token = Token.Unknown;
  let tokenPosition = -1;
  let tokenValue: string | undefined = undefined;
  let tokenFlags = 0;

  return {
    get position() { return position; },
    get token() { return token; },
    get tokenPosition() { return tokenPosition; },
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
    return token = t;
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
    tokenFlags = 0;

    if (!eof()) {
      const ch = input.charCodeAt(position);
      switch (ch) {
        case CharacterCodes.carriageReturn:
          if (lookAhead(1) === CharacterCodes.lineFeed) {
            position++;
          }
          return next(Token.NewLine);

        case CharacterCodes.lineFeed:
        case CharacterCodes.lineSeparator:
        case CharacterCodes.paragraphSeparator:
          return next(Token.NewLine);

        case CharacterCodes.tab:
        case CharacterCodes.verticalTab:
        case CharacterCodes.formFeed:
        case CharacterCodes.space:
        case CharacterCodes.nonBreakingSpace:
        case CharacterCodes.ogham:
        case CharacterCodes.enQuad:
        case CharacterCodes.emQuad:
        case CharacterCodes.enSpace:
        case CharacterCodes.emSpace:
        case CharacterCodes.threePerEmSpace:
        case CharacterCodes.fourPerEmSpace:
        case CharacterCodes.sixPerEmSpace:
        case CharacterCodes.figureSpace:
        case CharacterCodes.punctuationSpace:
        case CharacterCodes.thinSpace:
        case CharacterCodes.hairSpace:
        case CharacterCodes.zeroWidthSpace:
        case CharacterCodes.narrowNoBreakSpace:
        case CharacterCodes.mathematicalSpace:
        case CharacterCodes.ideographicSpace:
        case CharacterCodes.byteOrderMark:
          return scanWhitespace();

        case CharacterCodes.openParen:
          return next(Token.OpenParen);

        case CharacterCodes.closeParen:
          return next(Token.CloseParen);

        case CharacterCodes.comma:
          return next(Token.Comma);

        case CharacterCodes.colon:
          return next(Token.Colon);

        case CharacterCodes.semicolon:
          return next(Token.Semicolon);

        case CharacterCodes.openBracket:
          return next(Token.OpenBracket);

        case CharacterCodes.closeBracket:
          return next(Token.CloseBracket);

        case CharacterCodes.openBrace:
          return next(Token.OpenBrace);

        case CharacterCodes.closeBrace:
          return next(Token.CloseBrace);

        case CharacterCodes.at:
          return next(Token.At);

        case CharacterCodes.question:
          return next(Token.Question);

        case CharacterCodes.ampersand:
          return next(Token.Ampersand);

        case CharacterCodes.dot:
          return lookAhead(1) === CharacterCodes.dot &&
                 lookAhead(2) === CharacterCodes.dot ?
            next(Token.Elipsis, 3) :
            next(Token.Dot);

        case CharacterCodes.slash:
          switch (lookAhead(1)) {
            case CharacterCodes.slash:
              return scanSingleLineComment();
            case CharacterCodes.asterisk:
              return scanMultiLineComment();
          }
          return unknownToken();

        case CharacterCodes._0:
          switch (lookAhead(1)) {
            case CharacterCodes.x:
              return scanHexNumber();
            case CharacterCodes.b:
              return scanBinaryNumber();
          }
          return scanNumber();

        case CharacterCodes._1:
        case CharacterCodes._2:
        case CharacterCodes._3:
        case CharacterCodes._4:
        case CharacterCodes._5:
        case CharacterCodes._6:
        case CharacterCodes._7:
        case CharacterCodes._8:
        case CharacterCodes._9:
          return scanNumber();

        case CharacterCodes.lessThan:
          return isConflictMarker() ?
            next(Token.ConflictMarker, mergeConflictMarkerLength) :
            next(Token.LessThan);

        case CharacterCodes.greaterThan:
          return isConflictMarker() ?
            next(Token.ConflictMarker, mergeConflictMarkerLength) :
            next(Token.GreaterThan);

        case CharacterCodes.equals:
          return isConflictMarker() ?
            next(Token.ConflictMarker, mergeConflictMarkerLength) :
            next(Token.Equals);

        case CharacterCodes.bar:
          return isConflictMarker() ?
            next(Token.ConflictMarker, mergeConflictMarkerLength) :
            next(Token.Bar);

        case CharacterCodes.doubleQuote:
          return scanString();

        default:
          return isIdentifierStart(ch) ? scanIdentifier() : unknownToken();

      }
    }

    return token = Token.EndOfFile;
  }

  function unknownToken() {
    token = next(Token.Unknown);
    error(messages.UnexpectedToken, getTokenText());
    return token;
  }

  function isConflictMarker() {
    // Conflict markers must be at the start of a line.
    const ch = input.charCodeAt(position);
    if (position === 0 || isLineBreak(input.charCodeAt(position - 1))) {
      if ((position + mergeConflictMarkerLength) < input.length) {
        for (let i = 0; i < mergeConflictMarkerLength; i++) {
          if (lookAhead(i) !== ch) {
            return false;
          }
        }
        return ch === CharacterCodes.equals || lookAhead(mergeConflictMarkerLength) === CharacterCodes.space;
      }
    }

    return false;
  }

  function error(msg: Message, ...params: Array<string | number>) {
    onError(msg, params);
  }

  function scanWhitespace(): Token {
    do {
      position++;
    } while (isWhiteSpaceSingleLine(input.charCodeAt(position)));

    return token = Token.Whitespace;
  }

  function scanDigits() {
    while (isDigit(input.charCodeAt(position))) {
      position++;
    }
  }

  function scanNumber() {
    scanDigits();

    let ch = input.charCodeAt(position);

    if (ch === CharacterCodes.dot) {
      position++;
      scanDigits();
    }

    ch = input.charCodeAt(position);
    if (ch === CharacterCodes.e) {
      position++;
      ch = input.charCodeAt(position);
      if (ch === CharacterCodes.plus || ch == CharacterCodes.minus) {
        position++;
        ch = input.charCodeAt(position);
      }

      if (isDigit(ch)) {
        position++;
        scanDigits();
      } else {
        error(messages.DigitExpected);
      }
    }

    return token = Token.NumericLiteral;
  }

  function scanHexNumber() {
    if (!isHexDigit(lookAhead(2))) {
      error(messages.HexDigitExpected);
      return next(Token.NumericLiteral, 2);
    }

    position += 2;
    scanUntil(ch => !isHexDigit(ch), 'Hex Digit');
    return token = Token.NumericLiteral;
  }

  function scanBinaryNumber() {
    if (!isBinaryDigit(lookAhead(2))) {
      error(messages.BinaryDigitExpected);
      return next(Token.NumericLiteral, 2);
    }

    position += 2;
    scanUntil(ch => !isBinaryDigit(ch), 'Binary Digit');
    return token = Token.NumericLiteral;

  }

  function scanUntil(predicate: (char: number) => boolean, expectedClose?: string, consumeClose?: number) {
    let ch: number;

    do {
      position++;

      if (eof()) {
        if (expectedClose) {
          error(messages.UnexpectedEndOfFile, expectedClose);
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
    return token = Token.SingleLineComment;
  }

  function scanMultiLineComment() {
    scanUntil(ch => ch === CharacterCodes.asterisk && lookAhead(1) === CharacterCodes.slash, '*/', 2);
    return token = Token.MultiLineComment;
  }

  function scanString() {
    let quoteLength = 1;
    let closing = '"';
    let isEscaping = false;

    const tripleQuoted = lookAhead(1) === CharacterCodes.doubleQuote &&
                         lookAhead(2) === CharacterCodes.doubleQuote;

    if (tripleQuoted) {
      tokenFlags |= TokenFlags.TripleQuoted;
      quoteLength = 3;
      closing = '"""';
    }

    position += quoteLength;

    scanUntil(ch => {
      if (isEscaping) {
        isEscaping = false;
        return false;
      }

      switch (ch) {
        case CharacterCodes.carriageReturn:
          if (lookAhead(1) === CharacterCodes.lineFeed) {
            tokenFlags |= TokenFlags.HasCrlf;
          }
          return false;

        case CharacterCodes.backslash:
          isEscaping = true;
          tokenFlags |= TokenFlags.Escaped;
          return false;

        case CharacterCodes.doubleQuote:
          if (tripleQuoted) {
            return lookAhead(1) === CharacterCodes.doubleQuote && lookAhead(2) === CharacterCodes.doubleQuote;
          }
          return true;

        default:
          return false;
      }
    }, closing, quoteLength);

    return token = Token.StringLiteral;
  }

  function getTokenValue() {
    if (tokenValue !== undefined) {
      return tokenValue;
    }

    if (token !== Token.StringLiteral) {
      return tokenValue = getTokenText();
    }

    // strip quotes
    const quoteLength = (tokenFlags & TokenFlags.TripleQuoted) ? 3 : 1;
    let value = input.substring(tokenPosition + quoteLength, position - quoteLength);

    // Normalize CRLF to LF when interpreting value of multi-line string
    // literals. Matches JavaScript behavior and ensures program behavior does
    // not change due to line-ending conversion.
    if (tokenFlags & TokenFlags.HasCrlf) {
      value = value.replace(/\r\n/g, '\n');
    }

    if (tokenFlags & TokenFlags.TripleQuoted) {
      value = unindentTripleQuoteString(value);
    }

    if (tokenFlags & TokenFlags.Escaped) {
      value = unescapeString(value);
    }

    return tokenValue = value;
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
      error(messages.NoNewLineAtStartOfTripleQuotedString);
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
      error(messages.NoNewLineAtEndOfTripleQuotedString);
    }

    // remove required matching indentation from each line
    return removeMatchingIndentation(text, start, end, indentation);
  }

  function removeMatchingIndentation(text: string, start: number, end: number, indentation: string) {
    let result = '';
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
        error(messages.InconsistentTripleQuoteIndentation);
        break;
      }
      indentationPos++;
      pos++;
    }

    return pos;
  }

  function unescapeString(text: string) {
    let result = '';
    let start = 0;
    let pos = 0;
    const end = text.length;

    while (pos < end) {
      let ch = text.charCodeAt(pos);
      if (ch != CharacterCodes.backslash) {
        pos++;
        continue;
      }

      result += text.substring(start, pos);
      pos++;
      ch = text.charCodeAt(pos);

      switch (ch) {
        case CharacterCodes.r:
          result += '\r';
          break;
        case CharacterCodes.n:
          result += '\n';
          break;
        case CharacterCodes.t:
          result += '\t';
          break;
        case CharacterCodes.doubleQuote:
          result += '"';
          break;
        case CharacterCodes.backslash:
          result += '\\';
          break;
        default:
          error(messages.InvalidEscapeSequence);
          result += String.fromCharCode(ch);
          break;
      }

      pos++;
      start = pos;
    }

    result += text.substring(start, pos);
    return result;
  }

  function scanIdentifier() {
    scanUntil(ch => !isIdentifierPart(ch));
    return token = keywords.get(getTokenValue()) ?? Token.Identifier;
  }
}
