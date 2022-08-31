import {
  CharCode,
  isAsciiIdentifierContinue,
  isAsciiIdentifierStart,
  isBinaryDigit,
  isDigit,
  isHexDigit,
  isIdentifierContinue,
  isLineBreak,
  isLowercaseAsciiLetter,
  isNonAsciiIdentifierCharacter,
  isNonAsciiWhiteSpaceSingleLine,
  isWhiteSpace,
  isWhiteSpaceSingleLine,
  utf16CodeUnits,
} from "./charcode.js";
import { compilerAssert, createSourceFile, DiagnosticHandler } from "./diagnostics.js";
import { CompilerDiagnostics, createDiagnostic } from "./messages.js";
import { DiagnosticReport, SourceFile } from "./types.js";

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = 7;

export enum Token {
  None,
  Invalid,
  EndOfFile,
  Identifier,
  NumericLiteral,
  StringLiteral,
  ConflictMarker,
  // Add new tokens above if they don't fit any of the categories below

  ///////////////////////////////////////////////////////////////
  // Trivia
  /**@internal */ __StartTrivia,

  SingleLineComment = __StartTrivia,
  MultiLineComment,
  NewLine,
  Whitespace,
  // Add new trivia above

  /** @internal */ __EndTrivia,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Punctuation
  /** @internal */ __StartPunctuation = __EndTrivia,

  OpenBrace = __StartPunctuation,
  CloseBrace,
  OpenParen,
  CloseParen,
  OpenBracket,
  CloseBracket,
  Dot,
  Ellipsis,
  Semicolon,
  Comma,
  LessThan,
  GreaterThan,
  Equals,
  Ampersand,
  Bar,
  Question,
  Colon,
  ColonColon,
  At,
  Hash,
  Star,
  ForwardSlash,
  Plus,
  Hyphen,
  Exclamation,
  LessThanEquals,
  GreaterThanEquals,
  AmpsersandAmpersand,
  BarBar,
  EqualsEquals,
  ExclamationEquals,
  EqualsGreaterThan,
  // Add new punctuation above

  /** @internal */ __EndPunctuation,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Statement keywords
  /** @internal */ __StartKeyword = __EndPunctuation,
  /** @internal */ __StartStatementKeyword = __StartKeyword,

  ImportKeyword = __StartStatementKeyword,
  ModelKeyword,
  NamespaceKeyword,
  UsingKeyword,
  OpKeyword,
  EnumKeyword,
  AliasKeyword,
  IsKeyword,
  InterfaceKeyword,
  UnionKeyword,
  ProjectionKeyword,
  ElseKeyword,
  IfKeyword,
  // Add new statement keyword above

  /** @internal */ __EndStatementKeyword,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Other keywords

  ExtendsKeyword = __EndStatementKeyword,
  TrueKeyword,
  FalseKeyword,
  ReturnKeyword,
  VoidKeyword,
  NeverKeyword,
  UnknownKeyword,
  // Add new non-statement keyword above

  /** @internal */ __EndKeyword,
  ///////////////////////////////////////////////////////////////

  /** @internal */ __Count = __EndKeyword,
}

/** @internal */
export const TokenDisplay = getTokenDisplayTable([
  [Token.None, "none"],
  [Token.Invalid, "invalid"],
  [Token.EndOfFile, "end of file"],
  [Token.SingleLineComment, "single-line comment"],
  [Token.MultiLineComment, "multi-line comment"],
  [Token.ConflictMarker, "conflict marker"],
  [Token.NumericLiteral, "numeric literal"],
  [Token.StringLiteral, "string literal"],
  [Token.NewLine, "newline"],
  [Token.Whitespace, "whitespace"],
  [Token.OpenBrace, "'{'"],
  [Token.CloseBrace, "'}'"],
  [Token.OpenParen, "'('"],
  [Token.CloseParen, "')'"],
  [Token.OpenBracket, "'['"],
  [Token.CloseBracket, "']'"],
  [Token.Dot, "'.'"],
  [Token.Ellipsis, "'...'"],
  [Token.Semicolon, "';'"],
  [Token.Comma, "','"],
  [Token.LessThan, "'<'"],
  [Token.GreaterThan, "'>'"],
  [Token.Equals, "'='"],
  [Token.Ampersand, "'&'"],
  [Token.Bar, "'|'"],
  [Token.Question, "'?'"],
  [Token.Colon, "':'"],
  [Token.ColonColon, "'::'"],
  [Token.At, "'@'"],
  [Token.Hash, "'#'"],
  [Token.Star, "'*'"],
  [Token.ForwardSlash, "'/'"],
  [Token.Plus, "'+'"],
  [Token.Hyphen, "'-'"],
  [Token.Exclamation, "'!'"],
  [Token.LessThanEquals, "'<='"],
  [Token.GreaterThanEquals, "'>='"],
  [Token.AmpsersandAmpersand, "'&&'"],
  [Token.BarBar, "'||'"],
  [Token.EqualsEquals, "'=='"],
  [Token.ExclamationEquals, "'!='"],
  [Token.EqualsGreaterThan, "'=>'"],
  [Token.Identifier, "identifier"],
  [Token.ImportKeyword, "'import'"],
  [Token.ModelKeyword, "'model'"],
  [Token.NamespaceKeyword, "'namespace'"],
  [Token.UsingKeyword, "'using'"],
  [Token.OpKeyword, "'op'"],
  [Token.EnumKeyword, "'enum'"],
  [Token.AliasKeyword, "'alias'"],
  [Token.IsKeyword, "'is'"],
  [Token.InterfaceKeyword, "'interface'"],
  [Token.UnionKeyword, "'union'"],
  [Token.ProjectionKeyword, "'projection'"],
  [Token.ElseKeyword, "'else'"],
  [Token.IfKeyword, "'if'"],
  [Token.ExtendsKeyword, "'extends'"],
  [Token.TrueKeyword, "'true'"],
  [Token.FalseKeyword, "'false'"],
  [Token.ReturnKeyword, "'return'"],
  [Token.VoidKeyword, "'void'"],
  [Token.NeverKeyword, "'never'"],
  [Token.UnknownKeyword, "'unknown'"],
]);

/** @internal */
export const Keywords: ReadonlyMap<string, Token> = new Map([
  ["import", Token.ImportKeyword],
  ["model", Token.ModelKeyword],
  ["namespace", Token.NamespaceKeyword],
  ["interface", Token.InterfaceKeyword],
  ["union", Token.UnionKeyword],
  ["if", Token.IfKeyword],
  ["else", Token.ElseKeyword],
  ["projection", Token.ProjectionKeyword],
  ["using", Token.UsingKeyword],
  ["op", Token.OpKeyword],
  ["extends", Token.ExtendsKeyword],
  ["is", Token.IsKeyword],
  ["enum", Token.EnumKeyword],
  ["alias", Token.AliasKeyword],
  ["true", Token.TrueKeyword],
  ["false", Token.FalseKeyword],
  ["return", Token.ReturnKeyword],
  ["void", Token.VoidKeyword],
  ["never", Token.NeverKeyword],
  ["unknown", Token.UnknownKeyword],
]);

/** @internal */
export const enum KeywordLimit {
  MinLength = 2,
  MaxLength = 10,
}

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
   * String literals are escaped and unquoted, identifiers are normalized,
   * and all other tokens return their exact spelling sames as
   * getTokenText().
   */
  getTokenValue(): string;
}

const enum TokenFlags {
  None = 0,
  Escaped = 1 << 0,
  TripleQuoted = 1 << 1,
  Unterminated = 1 << 2,
  NonAscii = 1 << 3,
}

export function isTrivia(token: Token) {
  return token >= Token.__StartTrivia && token < Token.__EndTrivia;
}

export function isComment(token: Token) {
  return token === Token.SingleLineComment || token === Token.MultiLineComment;
}

export function isKeyword(token: Token) {
  return token >= Token.__StartKeyword && token < Token.__EndKeyword;
}

export function isPunctuation(token: Token) {
  return token >= Token.__StartPunctuation && token < Token.__EndPunctuation;
}

export function isStatementKeyword(token: Token) {
  return token >= Token.__StartStatementKeyword && token < Token.__EndStatementKeyword;
}

export function createScanner(
  source: string | SourceFile,
  diagnosticHandler: DiagnosticHandler
): Scanner {
  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;
  const input = file.text;
  let position = 0;
  let token = Token.None;
  let tokenPosition = -1;
  let tokenFlags = TokenFlags.None;

  // Skip BOM
  if (input.charCodeAt(position) === CharCode.ByteOrderMark) {
    position++;
  }

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

  function getTokenText() {
    return input.substring(tokenPosition, position);
  }

  function getTokenValue() {
    switch (token) {
      case Token.StringLiteral:
        return getStringTokenValue();
      case Token.Identifier:
        return getIdentifierTokenValue();
      default:
        return getTokenText();
    }
  }

  function lookAhead(offset: number) {
    return input.charCodeAt(position + offset);
  }

  function scan(): Token {
    tokenPosition = position;
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
          return next(Token.NewLine);

        case CharCode.Space:
        case CharCode.Tab:
        case CharCode.VerticalTab:
        case CharCode.FormFeed:
          return scanWhitespace();

        case CharCode.OpenParen:
          return next(Token.OpenParen);

        case CharCode.CloseParen:
          return next(Token.CloseParen);

        case CharCode.Comma:
          return next(Token.Comma);

        case CharCode.Colon:
          return lookAhead(1) === CharCode.Colon ? next(Token.ColonColon, 2) : next(Token.Colon);

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

        case CharCode.Hash:
          return next(Token.Hash);

        case CharCode.Plus:
          return isDigit(lookAhead(1)) ? scanSignedNumber() : next(Token.Plus);

        case CharCode.Minus:
          return isDigit(lookAhead(1)) ? scanSignedNumber() : next(Token.Hyphen);

        case CharCode.Asterisk:
          return next(Token.Star);

        case CharCode.Question:
          return next(Token.Question);

        case CharCode.Ampersand:
          return lookAhead(1) === CharCode.Ampersand
            ? next(Token.AmpsersandAmpersand, 2)
            : next(Token.Ampersand);

        case CharCode.Dot:
          return lookAhead(1) === CharCode.Dot && lookAhead(2) === CharCode.Dot
            ? next(Token.Ellipsis, 3)
            : next(Token.Dot);

        case CharCode.Slash:
          switch (lookAhead(1)) {
            case CharCode.Slash:
              return scanSingleLineComment();
            case CharCode.Asterisk:
              return scanMultiLineComment();
          }

          return next(Token.ForwardSlash);

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
          return lookAhead(1) === CharCode.Equals
            ? next(Token.LessThanEquals, 2)
            : isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.LessThan);

        case CharCode.GreaterThan:
          return lookAhead(1) === CharCode.Equals
            ? next(Token.GreaterThanEquals, 2)
            : isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.GreaterThan);

        case CharCode.Equals:
          return lookAhead(1) === CharCode.Equals
            ? next(Token.EqualsEquals, 2)
            : lookAhead(1) === CharCode.GreaterThan
            ? next(Token.EqualsGreaterThan, 2)
            : isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.Equals);

        case CharCode.Bar:
          return lookAhead(1) === CharCode.Bar
            ? next(Token.BarBar, 2)
            : isConflictMarker()
            ? next(Token.ConflictMarker, mergeConflictMarkerLength)
            : next(Token.Bar);

        case CharCode.DoubleQuote:
          return lookAhead(1) === CharCode.DoubleQuote && lookAhead(2) === CharCode.DoubleQuote
            ? scanTripleQuotedString()
            : scanString();
        case CharCode.Exclamation:
          return lookAhead(1) === CharCode.Equals
            ? next(Token.ExclamationEquals, 2)
            : next(Token.Exclamation);
        default:
          if (isLowercaseAsciiLetter(ch)) {
            return scanIdentifierOrKeyword();
          }

          if (isAsciiIdentifierStart(ch)) {
            return scanIdentifier();
          }

          if (ch <= CharCode.MaxAscii) {
            return scanInvalidCharacter();
          }

          return scanNonAsciiToken();
      }
    }

    return (token = Token.EndOfFile);
  }

  function next(t: Token, count = 1) {
    position += count;
    return (token = t);
  }

  function unterminated(t: Token) {
    tokenFlags |= TokenFlags.Unterminated;
    error({ code: "unterminated", format: { token: TokenDisplay[t] } });
    return (token = t);
  }

  function scanNonAsciiToken() {
    tokenFlags |= TokenFlags.NonAscii;
    const ch = input.charCodeAt(position);

    if (isNonAsciiWhiteSpaceSingleLine(ch)) {
      return scanWhitespace();
    }

    const cp = input.codePointAt(position)!;
    if (isNonAsciiIdentifierCharacter(cp)) {
      return scanNonAsciiIdentifier(cp);
    }

    return scanInvalidCharacter();
  }

  function scanInvalidCharacter() {
    const codePoint = input.codePointAt(position)!;
    token = next(Token.Invalid, utf16CodeUnits(codePoint));
    error({ code: "invalid-character" });
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

  function error<
    C extends keyof CompilerDiagnostics,
    M extends keyof CompilerDiagnostics[C] = "default"
  >(report: Omit<DiagnosticReport<CompilerDiagnostics, C, M>, "target">) {
    const diagnostic = createDiagnostic({
      ...report,
      target: { file, pos: tokenPosition, end: position },
    } as any);
    diagnosticHandler(diagnostic);
  }

  function scanWhitespace(): Token {
    do {
      position++;
    } while (!eof() && isWhiteSpaceSingleLine(input.charCodeAt(position)));

    return (token = Token.Whitespace);
  }

  function scanSignedNumber() {
    position++; // consume '+/-'
    return scanNumber();
  }

  function scanNumber() {
    scanKnownDigits();
    if (!eof() && input.charCodeAt(position) === CharCode.Dot) {
      position++;
      scanRequiredDigits();
    }
    if (!eof() && input.charCodeAt(position) === CharCode.e) {
      position++;
      const ch = input.charCodeAt(position);
      if (ch === CharCode.Plus || ch === CharCode.Minus) {
        position++;
      }
      scanRequiredDigits();
    }
    return (token = Token.NumericLiteral);
  }

  function scanKnownDigits() {
    do {
      position++;
    } while (!eof() && isDigit(input.charCodeAt(position)));
  }

  function scanRequiredDigits() {
    if (eof() || !isDigit(input.charCodeAt(position))) {
      error({ code: "digit-expected" });
      return;
    }
    scanKnownDigits();
  }

  function scanHexNumber() {
    position += 2; // consume '0x'

    if (eof() || !isHexDigit(input.charCodeAt(position))) {
      error({ code: "hex-digit-expected" });
      return (token = Token.NumericLiteral);
    }
    do {
      position++;
    } while (!eof() && isHexDigit(input.charCodeAt(position)));

    return (token = Token.NumericLiteral);
  }

  function scanBinaryNumber() {
    position += 2; // consume '0b'

    if (eof() || !isBinaryDigit(input.charCodeAt(position))) {
      error({ code: "binary-digit-expected" });
      return (token = Token.NumericLiteral);
    }
    do {
      position++;
    } while (!eof() && isBinaryDigit(input.charCodeAt(position)));

    return (token = Token.NumericLiteral);
  }

  function scanSingleLineComment() {
    position = skipSingleLineComment(input, position);
    return (token = Token.SingleLineComment);
  }

  function scanMultiLineComment() {
    const [newPosition, terminated] = skipMultiLineComment(input, position);
    position = newPosition;
    token = Token.MultiLineComment;
    return terminated ? token : unterminated(token);
  }

  function scanString() {
    position++; // consume '"'

    loop: for (; !eof(); position++) {
      const ch = input.charCodeAt(position);
      switch (ch) {
        case CharCode.Backslash:
          tokenFlags |= TokenFlags.Escaped;
          position++;
          if (eof()) {
            break loop;
          }
          continue;
        case CharCode.DoubleQuote:
          position++;
          return (token = Token.StringLiteral);
        case CharCode.CarriageReturn:
        case CharCode.LineFeed:
          break loop;
      }
    }

    return unterminated(Token.StringLiteral);
  }

  function scanTripleQuotedString() {
    tokenFlags |= TokenFlags.TripleQuoted;
    position += 3; // consume '"""'

    for (; !eof(); position++) {
      if (
        input.charCodeAt(position) === CharCode.DoubleQuote &&
        lookAhead(1) === CharCode.DoubleQuote &&
        lookAhead(2) === CharCode.DoubleQuote
      ) {
        position += 3;
        return (token = Token.StringLiteral);
      }
    }

    return unterminated(Token.StringLiteral);
  }

  function getStringTokenValue() {
    const quoteLength = tokenFlags & TokenFlags.TripleQuoted ? 3 : 1;
    const start = tokenPosition + quoteLength;
    const end = tokenFlags & TokenFlags.Unterminated ? position : position - quoteLength;

    if (tokenFlags & TokenFlags.TripleQuoted) {
      return unindentAndUnescapeTripleQuotedString(start, end);
    }

    if (tokenFlags & TokenFlags.Escaped) {
      return unescapeString(start, end);
    }

    return input.substring(start, end);
  }

  function getIdentifierTokenValue() {
    const text = getTokenText();
    return tokenFlags & TokenFlags.NonAscii ? text.normalize("NFC") : text;
  }

  function unindentAndUnescapeTripleQuotedString(start: number, end: number) {
    // ignore leading whitespace before required initial line break
    while (start < end && isWhiteSpaceSingleLine(input.charCodeAt(start))) {
      start++;
    }

    // remove required initial line break
    if (isLineBreak(input.charCodeAt(start))) {
      if (isCrlf(start, start, end)) {
        start++;
      }
      start++;
    } else {
      error({ code: "no-new-line-start-triple-quote" });
    }

    // remove whitespace before closing delimiter and record it as required
    // indentation for all lines
    const indentationEnd = end;
    while (end > start && isWhiteSpaceSingleLine(input.charCodeAt(end - 1))) {
      end--;
    }
    const indentationStart = end;

    // remove required final line break
    if (isLineBreak(input.charCodeAt(end - 1))) {
      if (isCrlf(end - 2, start, end)) {
        end--;
      }
      end--;
    } else {
      error({ code: "no-new-line-end-triple-quote" });
    }

    // remove required matching indentation from each line and unescape in the
    // process of doing so
    let result = "";
    let pos = start;
    while (pos < end) {
      // skip indentation at start of line
      start = skipMatchingIndentation(pos, end, indentationStart, indentationEnd);
      let ch;

      while (pos < end && !isLineBreak((ch = input.charCodeAt(pos)))) {
        if (ch !== CharCode.Backslash) {
          pos++;
          continue;
        }
        result += input.substring(start, pos);
        if (pos === end - 1) {
          error({ code: "invalid-escape-sequence" });
          pos++;
        } else {
          result += unescapeOne(pos);
          pos += 2;
        }
        start = pos;
      }

      if (pos < end) {
        if (isCrlf(pos, start, end)) {
          // CRLF in multi-line string is normalized to LF in string value.
          // This keeps program behavior unchanged by line-eding conversion.
          result += input.substring(start, pos);
          result += "\n";
          pos += 2;
        } else {
          pos++; // include non-CRLF newline
          result += input.substring(start, pos);
        }
        start = pos;
      }
    }

    result += input.substring(start, pos);
    return result;
  }

  function isCrlf(pos: number, start: number, end: number) {
    return (
      pos >= start &&
      pos < end - 1 &&
      input.charCodeAt(pos) === CharCode.CarriageReturn &&
      input.charCodeAt(pos + 1) === CharCode.LineFeed
    );
  }

  function skipMatchingIndentation(
    pos: number,
    end: number,
    indentationStart: number,
    indentationEnd: number
  ) {
    let indentationPos = indentationStart;
    end = Math.min(end, pos + (indentationEnd - indentationStart));

    while (pos < end) {
      const ch = input.charCodeAt(pos);
      if (isLineBreak(ch)) {
        // allow subset of indentation if line has only whitespace
        break;
      }
      if (ch !== input.charCodeAt(indentationPos)) {
        error({ code: "triple-quote-indent" });
        break;
      }
      indentationPos++;
      pos++;
    }

    return pos;
  }

  function unescapeString(start: number, end: number) {
    let result = "";
    let pos = start;

    while (pos < end) {
      const ch = input.charCodeAt(pos);
      if (ch !== CharCode.Backslash) {
        pos++;
        continue;
      }

      if (pos === end - 1) {
        error({ code: "invalid-escape-sequence" });
        break;
      }

      result += input.substring(start, pos);
      result += unescapeOne(pos);
      pos += 2;
      start = pos;
    }

    result += input.substring(start, pos);
    return result;
  }

  function unescapeOne(pos: number) {
    const ch = input.charCodeAt(pos + 1);
    switch (ch) {
      case CharCode.r:
        return "\r";
      case CharCode.n:
        return "\n";
      case CharCode.t:
        return "\t";
      case CharCode.DoubleQuote:
        return '"';
      case CharCode.Backslash:
        return "\\";
      default:
        error({ code: "invalid-escape-sequence" });
        return String.fromCharCode(ch);
    }
  }

  function scanIdentifierOrKeyword() {
    let count = 0;
    let ch = input.charCodeAt(position);

    while (true) {
      position++;
      count++;

      if (eof()) {
        break;
      }

      ch = input.charCodeAt(position);
      if (count < KeywordLimit.MaxLength && isLowercaseAsciiLetter(ch)) {
        continue;
      }

      if (isAsciiIdentifierContinue(ch)) {
        return scanIdentifier();
      }

      if (ch > CharCode.MaxAscii) {
        const cp = input.codePointAt(position)!;
        if (isNonAsciiIdentifierCharacter(cp)) {
          return scanNonAsciiIdentifier(cp);
        }
      }

      break;
    }

    if (count >= KeywordLimit.MinLength && count <= KeywordLimit.MaxLength) {
      const keyword = Keywords.get(getTokenText());
      if (keyword) {
        return (token = keyword);
      }
    }

    return (token = Token.Identifier);
  }

  function scanIdentifier() {
    let ch: number;

    do {
      position++;
      if (eof()) {
        return (token = Token.Identifier);
      }
    } while (isAsciiIdentifierContinue((ch = input.charCodeAt(position))));

    if (ch > CharCode.MaxAscii) {
      const cp = input.codePointAt(position)!;
      if (isNonAsciiIdentifierCharacter(cp)) {
        return scanNonAsciiIdentifier(cp);
      }
    }

    return (token = Token.Identifier);
  }

  function scanNonAsciiIdentifier(startCodePoint: number) {
    tokenFlags |= TokenFlags.NonAscii;
    let cp = startCodePoint;
    do {
      position += utf16CodeUnits(cp);
    } while (!eof() && isIdentifierContinue((cp = input.codePointAt(position)!)));

    return (token = Token.Identifier);
  }
}

export function skipTrivia(input: string, position: number): number {
  while (position < input.length) {
    const ch = input.charCodeAt(position);

    if (isWhiteSpace(ch)) {
      position++;
      continue;
    }

    if (ch === CharCode.Slash) {
      switch (input.charCodeAt(position + 1)) {
        case CharCode.Slash:
          position = skipSingleLineComment(input, position);
          continue;
        case CharCode.Asterisk:
          position = skipMultiLineComment(input, position)[0];
          continue;
      }
    }

    break;
  }

  return position;
}

export function skipWhiteSpace(input: string, position: number): number {
  while (position < input.length) {
    const ch = input.charCodeAt(position);

    if (!isWhiteSpace(ch)) {
      break;
    }
    position++;
  }

  return position;
}

function skipSingleLineComment(input: string, position: number): number {
  position += 2; // consume '//'

  for (; position < input.length; position++) {
    if (isLineBreak(input.charCodeAt(position))) {
      break;
    }
  }

  return position;
}

function skipMultiLineComment(
  input: string,
  position: number
): [position: number, terminated: boolean] {
  position += 2; // consume '/*'

  for (; position < input.length; position++) {
    if (
      input.charCodeAt(position) === CharCode.Asterisk &&
      input.charCodeAt(position + 1) === CharCode.Slash
    ) {
      return [position + 2, true];
    }
  }

  return [position, false];
}

function getTokenDisplayTable(entries: [Token, string][]): readonly string[] {
  const table = new Array<string>(entries.length);

  for (const [token, display] of entries) {
    compilerAssert(
      token >= 0 && token < Token.__Count,
      `Invalid entry in token display table, ${token}, ${Token[token]}, ${display}`
    );
    compilerAssert(
      !table[token],
      `Duplicate entry in token display table for: ${token}, ${Token[token]}, ${display}`
    );
    table[token] = display;
  }

  for (let token = 0; token < Token.__Count; token++) {
    compilerAssert(table[token], `Missing entry in token display table: ${token}, ${Token[token]}`);
  }

  return table;
}
