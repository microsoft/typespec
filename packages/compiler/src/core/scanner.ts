import {
  CharCode,
  codePointBefore,
  isAsciiIdentifierContinue,
  isAsciiIdentifierStart,
  isBinaryDigit,
  isDigit,
  isHexDigit,
  isIdentifierContinue,
  isIdentifierStart,
  isLineBreak,
  isLowercaseAsciiLetter,
  isNonAsciiIdentifierCharacter,
  isNonAsciiWhiteSpaceSingleLine,
  isWhiteSpace,
  isWhiteSpaceSingleLine,
  utf16CodeUnits,
} from "./charcode.js";
import { DiagnosticHandler, compilerAssert } from "./diagnostics.js";
import { CompilerDiagnostics, createDiagnostic } from "./messages.js";
import { getCommentAtPosition } from "./parser-utils.js";
import { createSourceFile } from "./source-file.js";
import { DiagnosticReport, SourceFile, TextRange, TypeSpecScriptNode } from "./types.js";

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
  StringTemplateHead,
  StringTemplateMiddle,
  StringTemplateTail,
  // Add new tokens above if they don't fit any of the categories below

  ///////////////////////////////////////////////////////////////
  // Trivia
  /** @internal */ __StartTrivia,

  SingleLineComment = __StartTrivia,
  MultiLineComment,
  NewLine,
  Whitespace,
  ConflictMarker,
  // Add new trivia above

  /** @internal */ __EndTrivia,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Doc comment content
  /** @internal */ __StartDocComment = __EndTrivia,
  DocText = __StartDocComment,
  DocCodeSpan,
  DocCodeFenceDelimiter,
  /** @internal */ __EndDocComment,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Punctuation
  /** @internal */ __StartPunctuation = __EndDocComment,

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
  AtAt,
  Hash,
  HashBrace,
  HashBracket,
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
  ScalarKeyword,
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
  DecKeyword,
  FnKeyword,
  ConstKeyword,
  InitKeyword,
  // Add new statement keyword above

  /** @internal */ __EndStatementKeyword,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////

  /** @internal */ __StartModifierKeyword = __EndStatementKeyword,

  ExternKeyword = __StartModifierKeyword,

  /** @internal */ __EndModifierKeyword,
  ///////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////
  // Other keywords

  ExtendsKeyword = __EndModifierKeyword,
  TrueKeyword,
  FalseKeyword,
  ReturnKeyword,
  VoidKeyword,
  NeverKeyword,
  UnknownKeyword,
  ValueOfKeyword,
  TypeOfKeyword,
  // Add new non-statement keyword above

  /** @internal */ __EndKeyword,
  ///////////////////////////////////////////////////////////////

  /** @internal */ __Count = __EndKeyword,
}

export type DocToken =
  | Token.NewLine
  | Token.Whitespace
  | Token.ConflictMarker
  | Token.Star
  | Token.At
  | Token.CloseBrace
  | Token.Identifier
  | Token.Hyphen
  | Token.DocText
  | Token.DocCodeSpan
  | Token.DocCodeFenceDelimiter
  | Token.EndOfFile;

export type StringTemplateToken =
  | Token.StringTemplateHead
  | Token.StringTemplateMiddle
  | Token.StringTemplateTail;

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
  [Token.StringTemplateHead, "string template head"],
  [Token.StringTemplateMiddle, "string template middle"],
  [Token.StringTemplateTail, "string template tail"],
  [Token.NewLine, "newline"],
  [Token.Whitespace, "whitespace"],
  [Token.DocCodeFenceDelimiter, "doc code fence delimiter"],
  [Token.DocCodeSpan, "doc code span"],
  [Token.DocText, "doc text"],
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
  [Token.AtAt, "'@@'"],
  [Token.Hash, "'#'"],
  [Token.HashBrace, "'#{'"],
  [Token.HashBracket, "'#['"],
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
  [Token.ScalarKeyword, "'scalar'"],
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
  [Token.DecKeyword, "'dec'"],
  [Token.FnKeyword, "'fn'"],
  [Token.ValueOfKeyword, "'valueof'"],
  [Token.TypeOfKeyword, "'typeof'"],
  [Token.ConstKeyword, "'const'"],
  [Token.InitKeyword, "'init'"],
  [Token.ExtendsKeyword, "'extends'"],
  [Token.TrueKeyword, "'true'"],
  [Token.FalseKeyword, "'false'"],
  [Token.ReturnKeyword, "'return'"],
  [Token.VoidKeyword, "'void'"],
  [Token.NeverKeyword, "'never'"],
  [Token.UnknownKeyword, "'unknown'"],
  [Token.ExternKeyword, "'extern'"],
]);

/** @internal */
export const Keywords: ReadonlyMap<string, Token> = new Map([
  ["import", Token.ImportKeyword],
  ["model", Token.ModelKeyword],
  ["scalar", Token.ScalarKeyword],
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
  ["dec", Token.DecKeyword],
  ["fn", Token.FnKeyword],
  ["valueof", Token.ValueOfKeyword],
  ["typeof", Token.TypeOfKeyword],
  ["const", Token.ConstKeyword],
  ["init", Token.InitKeyword],
  ["true", Token.TrueKeyword],
  ["false", Token.FalseKeyword],
  ["return", Token.ReturnKeyword],
  ["void", Token.VoidKeyword],
  ["never", Token.NeverKeyword],
  ["unknown", Token.UnknownKeyword],
  ["extern", Token.ExternKeyword],
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

  /** The flags on the current token. */
  readonly tokenFlags: TokenFlags;

  /** Advance one token. */
  scan(): Token;

  /** Advance one token inside DocComment. Use inside {@link scanRange} callback over DocComment range. */
  scanDoc(): DocToken;

  /**
   * Unconditionally back up and scan a template expression portion.
   * @param tokenFlags Token Flags for head StringTemplateToken
   */
  reScanStringTemplate(tokenFlags: TokenFlags): StringTemplateToken;

  /**
   * Finds the indent for the given triple quoted string.
   * @param start
   * @param end
   */
  findTripleQuotedStringIndent(start: number, end: number): [number, number];

  /**
   * Unindent and unescape the triple quoted string rawText
   */
  unindentAndUnescapeTripleQuotedString(
    start: number,
    end: number,
    indentationStart: number,
    indentationEnd: number,
    token: Token.StringLiteral | StringTemplateToken,
    tokenFlags: TokenFlags,
  ): string;

  /** Reset the scanner to the given start and end positions, invoke the callback, and then restore scanner state. */
  scanRange<T>(range: TextRange, callback: () => T): T;

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

export enum TokenFlags {
  None = 0,
  Escaped = 1 << 0,
  TripleQuoted = 1 << 1,
  Unterminated = 1 << 2,
  NonAscii = 1 << 3,
  DocComment = 1 << 4,
  Backticked = 1 << 5,
}

export function isTrivia(token: Token) {
  return token >= Token.__StartTrivia && token < Token.__EndTrivia;
}

export function isComment(token: Token): boolean {
  return token === Token.SingleLineComment || token === Token.MultiLineComment;
}

export function isKeyword(token: Token) {
  return token >= Token.__StartKeyword && token < Token.__EndKeyword;
}

export function isPunctuation(token: Token) {
  return token >= Token.__StartPunctuation && token < Token.__EndPunctuation;
}

export function isModifier(token: Token) {
  return token >= Token.__StartModifierKeyword && token < Token.__EndModifierKeyword;
}

export function isStatementKeyword(token: Token) {
  return token >= Token.__StartStatementKeyword && token < Token.__EndStatementKeyword;
}

export function createScanner(
  source: string | SourceFile,
  diagnosticHandler: DiagnosticHandler,
): Scanner {
  const file = typeof source === "string" ? createSourceFile(source, "<anonymous file>") : source;
  const input = file.text;
  let position = 0;
  let endPosition = input.length;
  let token = Token.None;
  let tokenPosition = -1;
  let tokenFlags = TokenFlags.None;
  // Skip BOM
  if (position < endPosition && input.charCodeAt(position) === CharCode.ByteOrderMark) {
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
    get tokenFlags() {
      return tokenFlags;
    },
    file,
    scan,
    scanRange,
    scanDoc,
    reScanStringTemplate,
    findTripleQuotedStringIndent,
    unindentAndUnescapeTripleQuotedString,
    eof,
    getTokenText,
    getTokenValue,
  };

  function eof() {
    return position >= endPosition;
  }

  function getTokenText() {
    return input.substring(tokenPosition, position);
  }

  function getTokenValue() {
    switch (token) {
      case Token.StringLiteral:
      case Token.StringTemplateHead:
      case Token.StringTemplateMiddle:
      case Token.StringTemplateTail:
        return getStringTokenValue(token, tokenFlags);
      case Token.Identifier:
        return getIdentifierTokenValue();
      case Token.DocText:
        return getDocTextValue();
      default:
        return getTokenText();
    }
  }

  function lookAhead(offset: number) {
    const p = position + offset;
    if (p >= endPosition) {
      return Number.NaN;
    }
    return input.charCodeAt(p);
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
          return lookAhead(1) === CharCode.At ? next(Token.AtAt, 2) : next(Token.At);

        case CharCode.Hash:
          const ahead = lookAhead(1);
          switch (ahead) {
            case CharCode.OpenBrace:
              return next(Token.HashBrace, 2);
            case CharCode.OpenBracket:
              return next(Token.HashBracket, 2);
            default:
              return next(Token.Hash);
          }

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
          if (atConflictMarker()) return scanConflictMarker();
          return lookAhead(1) === CharCode.Equals
            ? next(Token.LessThanEquals, 2)
            : next(Token.LessThan);

        case CharCode.GreaterThan:
          if (atConflictMarker()) return scanConflictMarker();
          return lookAhead(1) === CharCode.Equals
            ? next(Token.GreaterThanEquals, 2)
            : next(Token.GreaterThan);

        case CharCode.Equals:
          if (atConflictMarker()) return scanConflictMarker();
          switch (lookAhead(1)) {
            case CharCode.Equals:
              return next(Token.EqualsEquals, 2);
            case CharCode.GreaterThan:
              return next(Token.EqualsGreaterThan, 2);
          }
          return next(Token.Equals);

        case CharCode.Bar:
          if (atConflictMarker()) return scanConflictMarker();
          return lookAhead(1) === CharCode.Bar ? next(Token.BarBar, 2) : next(Token.Bar);

        case CharCode.DoubleQuote:
          return lookAhead(1) === CharCode.DoubleQuote && lookAhead(2) === CharCode.DoubleQuote
            ? scanString(TokenFlags.TripleQuoted)
            : scanString(TokenFlags.None);

        case CharCode.Exclamation:
          return lookAhead(1) === CharCode.Equals
            ? next(Token.ExclamationEquals, 2)
            : next(Token.Exclamation);

        case CharCode.Backtick:
          return scanBacktickedIdentifier();

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

  function scanDoc(): DocToken {
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

        case CharCode.Backslash:
          if (lookAhead(1) === CharCode.At) {
            tokenFlags |= TokenFlags.Escaped;
            return next(Token.DocText, 2);
          }
          return next(Token.DocText);

        case CharCode.Space:
        case CharCode.Tab:
        case CharCode.VerticalTab:
        case CharCode.FormFeed:
          return scanWhitespace();

        case CharCode.CloseBrace:
          return next(Token.CloseBrace);

        case CharCode.At:
          return next(Token.At);

        case CharCode.Asterisk:
          return next(Token.Star);

        case CharCode.Backtick:
          return lookAhead(1) === CharCode.Backtick && lookAhead(2) === CharCode.Backtick
            ? next(Token.DocCodeFenceDelimiter, 3)
            : scanDocCodeSpan();

        case CharCode.LessThan:
        case CharCode.GreaterThan:
        case CharCode.Equals:
        case CharCode.Bar:
          if (atConflictMarker()) return scanConflictMarker();
          return next(Token.DocText);

        case CharCode.Minus:
          return next(Token.Hyphen);
      }

      if (isAsciiIdentifierStart(ch)) {
        return scanIdentifier();
      }

      if (ch <= CharCode.MaxAscii) {
        return next(Token.DocText);
      }

      const cp = input.codePointAt(position)!;
      if (isIdentifierStart(cp)) {
        return scanNonAsciiIdentifier(cp);
      }

      return scanUnknown(Token.DocText);
    }

    return (token = Token.EndOfFile);
  }

  function reScanStringTemplate(lastTokenFlags: TokenFlags): StringTemplateToken {
    position = tokenPosition;
    tokenFlags = TokenFlags.None;
    return scanStringTemplateSpan(lastTokenFlags);
  }

  function scanRange<T>(range: TextRange, callback: () => T): T {
    const savedPosition = position;
    const savedEndPosition = endPosition;
    const savedToken = token;
    const savedTokenPosition = tokenPosition;
    const savedTokenFlags = tokenFlags;

    position = range.pos;
    endPosition = range.end;
    token = Token.None;
    tokenPosition = -1;
    tokenFlags = TokenFlags.None;

    const result = callback();

    position = savedPosition;
    endPosition = savedEndPosition;
    token = savedToken;
    tokenPosition = savedTokenPosition;
    tokenFlags = savedTokenFlags;

    return result;
  }

  function next<T extends Token>(t: T, count = 1): T {
    position += count;
    return (token = t) as T;
  }

  function unterminated<T extends Token>(t: T): T {
    tokenFlags |= TokenFlags.Unterminated;
    error({ code: "unterminated", format: { token: TokenDisplay[t] } });
    return (token = t) as T;
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

  function scanInvalidCharacter(): Token.Invalid {
    token = scanUnknown(Token.Invalid);
    error({ code: "invalid-character" });
    return token;
  }

  function scanUnknown<T extends Token>(t: T): T {
    const codePoint = input.codePointAt(position)!;
    return (token = next(t, utf16CodeUnits(codePoint)));
  }

  function error<
    C extends keyof CompilerDiagnostics,
    M extends keyof CompilerDiagnostics[C] = "default",
  >(
    report: Omit<DiagnosticReport<CompilerDiagnostics, C, M>, "target">,
    pos?: number,
    end?: number,
  ) {
    const diagnostic = createDiagnostic({
      ...report,
      target: { file, pos: pos ?? tokenPosition, end: end ?? position },
    } as any);
    diagnosticHandler(diagnostic);
  }

  function scanWhitespace(): Token.Whitespace {
    do {
      position++;
    } while (!eof() && isWhiteSpaceSingleLine(input.charCodeAt(position)));

    return (token = Token.Whitespace);
  }

  function scanSignedNumber(): Token.NumericLiteral {
    position++; // consume '+/-'
    return scanNumber();
  }

  function scanNumber(): Token.NumericLiteral {
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

  function scanKnownDigits(): void {
    do {
      position++;
    } while (!eof() && isDigit(input.charCodeAt(position)));
  }

  function scanRequiredDigits(): void {
    if (eof() || !isDigit(input.charCodeAt(position))) {
      error({ code: "digit-expected" });
      return;
    }
    scanKnownDigits();
  }

  function scanHexNumber(): Token.NumericLiteral {
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

  function scanBinaryNumber(): Token.NumericLiteral {
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

  function scanSingleLineComment(): Token.SingleLineComment {
    position = skipSingleLineComment(input, position, endPosition);
    return (token = Token.SingleLineComment);
  }

  function scanMultiLineComment(): Token.MultiLineComment {
    token = Token.MultiLineComment;
    if (lookAhead(2) === CharCode.Asterisk) {
      tokenFlags |= TokenFlags.DocComment;
    }
    const [newPosition, terminated] = skipMultiLineComment(input, position);
    position = newPosition;
    return terminated ? token : unterminated(token);
  }

  function scanDocCodeSpan(): Token.DocCodeSpan {
    position++; // consume '`'

    loop: for (; !eof(); position++) {
      const ch = input.charCodeAt(position);
      switch (ch) {
        case CharCode.Backtick:
          position++;
          return (token = Token.DocCodeSpan);
        case CharCode.CarriageReturn:
        case CharCode.LineFeed:
          break loop;
      }
    }

    return unterminated(Token.DocCodeSpan);
  }

  function scanString(tokenFlags: TokenFlags): Token.StringLiteral | Token.StringTemplateHead {
    if (tokenFlags & TokenFlags.TripleQuoted) {
      position += 3; // consume '"""'
    } else {
      position++; // consume '"'
    }

    return scanStringLiteralLike(tokenFlags, Token.StringTemplateHead, Token.StringLiteral);
  }

  function scanStringTemplateSpan(
    tokenFlags: TokenFlags,
  ): Token.StringTemplateMiddle | Token.StringTemplateTail {
    position++; // consume '{'

    return scanStringLiteralLike(tokenFlags, Token.StringTemplateMiddle, Token.StringTemplateTail);
  }

  function scanStringLiteralLike<M extends Token, T extends Token>(
    requestedTokenFlags: TokenFlags,
    template: M,
    tail: T,
  ): M | T {
    const multiLine = requestedTokenFlags & TokenFlags.TripleQuoted;
    tokenFlags = requestedTokenFlags;
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
          if (multiLine) {
            if (lookAhead(1) === CharCode.DoubleQuote && lookAhead(2) === CharCode.DoubleQuote) {
              position += 3;
              token = tail;
              return tail;
            } else {
              continue;
            }
          } else {
            position++;
            token = tail;
            return tail;
          }
        case CharCode.$:
          if (lookAhead(1) === CharCode.OpenBrace) {
            position += 2;
            token = template;
            return template;
          }
          continue;
        case CharCode.CarriageReturn:
        case CharCode.LineFeed:
          if (multiLine) {
            continue;
          } else {
            break loop;
          }
      }
    }

    return unterminated(tail);
  }

  function getStringLiteralOffsetStart(
    token: Token.StringLiteral | StringTemplateToken,
    tokenFlags: TokenFlags,
  ) {
    switch (token) {
      case Token.StringLiteral:
      case Token.StringTemplateHead:
        return tokenFlags & TokenFlags.TripleQuoted ? 3 : 1; // """ or "
      default:
        return 1; // {
    }
  }

  function getStringLiteralOffsetEnd(
    token: Token.StringLiteral | StringTemplateToken,
    tokenFlags: TokenFlags,
  ) {
    switch (token) {
      case Token.StringLiteral:
      case Token.StringTemplateTail:
        return tokenFlags & TokenFlags.TripleQuoted ? 3 : 1; // """ or "
      default:
        return 2; // ${
    }
  }

  function getStringTokenValue(
    token: Token.StringLiteral | StringTemplateToken,
    tokenFlags: TokenFlags,
  ): string {
    if (tokenFlags & TokenFlags.TripleQuoted) {
      const start = tokenPosition;
      const end = position;
      const [indentationStart, indentationEnd] = findTripleQuotedStringIndent(start, end);
      return unindentAndUnescapeTripleQuotedString(
        start,
        end,
        indentationStart,
        indentationEnd,
        token,
        tokenFlags,
      );
    }

    const startOffset = getStringLiteralOffsetStart(token, tokenFlags);
    const endOffset = getStringLiteralOffsetEnd(token, tokenFlags);
    const start = tokenPosition + startOffset;
    const end = tokenFlags & TokenFlags.Unterminated ? position : position - endOffset;

    if (tokenFlags & TokenFlags.Escaped) {
      return unescapeString(start, end);
    }

    return input.substring(start, end);
  }

  function getIdentifierTokenValue(): string {
    const start = tokenFlags & TokenFlags.Backticked ? tokenPosition + 1 : tokenPosition;
    const end =
      tokenFlags & TokenFlags.Backticked && !(tokenFlags & TokenFlags.Unterminated)
        ? position - 1
        : position;

    const text =
      tokenFlags & TokenFlags.Escaped ? unescapeString(start, end) : input.substring(start, end);

    if (tokenFlags & TokenFlags.NonAscii) {
      return text.normalize("NFC");
    }

    return text;
  }

  function getDocTextValue(): string {
    if (tokenFlags & TokenFlags.Escaped) {
      let start = tokenPosition;
      const end = position;

      let result = "";
      let pos = start;

      while (pos < end) {
        const ch = input.charCodeAt(pos);
        if (ch !== CharCode.Backslash) {
          pos++;
          continue;
        }

        if (pos === end - 1) {
          break;
        }

        result += input.substring(start, pos);
        switch (input.charCodeAt(pos + 1)) {
          case CharCode.At:
            result += "@";
            break;
          default:
            result += input.substring(pos, pos + 2);
        }
        pos += 2;
        start = pos;
      }

      result += input.substring(start, end);
      return result;
    } else {
      return input.substring(tokenPosition, position);
    }
  }

  function findTripleQuotedStringIndent(start: number, end: number): [number, number] {
    end = end - 3; // Remove the """
    // remove whitespace before closing delimiter and record it as required
    // indentation for all lines
    const indentationEnd = end;
    while (end > start && isWhiteSpaceSingleLine(input.charCodeAt(end - 1))) {
      end--;
    }
    const indentationStart = end;

    // remove required final line break
    if (isLineBreak(input.charCodeAt(end - 1))) {
      if (isCrlf(end - 2, 0, end)) {
        end--;
      }
      end--;
    } else {
      error({ code: "no-new-line-end-triple-quote" });
    }

    return [indentationStart, indentationEnd];
  }

  function unindentAndUnescapeTripleQuotedString(
    start: number,
    end: number,
    indentationStart: number,
    indentationEnd: number,
    token: Token.StringLiteral | StringTemplateToken,
    tokenFlags: TokenFlags,
  ): string {
    const startOffset = getStringLiteralOffsetStart(token, tokenFlags);
    const endOffset = getStringLiteralOffsetEnd(token, tokenFlags);
    start = start + startOffset;
    end = tokenFlags & TokenFlags.Unterminated ? end : end - endOffset;

    if (token === Token.StringLiteral || token === Token.StringTemplateHead) {
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
    }

    if (token === Token.StringLiteral || token === Token.StringTemplateTail) {
      while (end > start && isWhiteSpaceSingleLine(input.charCodeAt(end - 1))) {
        end--;
      }

      // remove required final line break
      if (isLineBreak(input.charCodeAt(end - 1))) {
        if (isCrlf(end - 2, start, end)) {
          end--;
        }
        end--;
      } else {
        error({ code: "no-new-line-end-triple-quote" });
      }
    }

    let skipUnindentOnce = false;
    // We are resuming from the middle of a line so we want to keep text as it is from there.
    if (token === Token.StringTemplateMiddle || token === Token.StringTemplateTail) {
      skipUnindentOnce = true;
    }
    // remove required matching indentation from each line and unescape in the
    // process of doing so
    let result = "";
    let pos = start;
    while (pos < end) {
      if (skipUnindentOnce) {
        skipUnindentOnce = false;
      } else {
        // skip indentation at start of line
        start = skipMatchingIndentation(pos, end, indentationStart, indentationEnd);
      }
      let ch;

      while (pos < end && !isLineBreak((ch = input.charCodeAt(pos)))) {
        if (ch !== CharCode.Backslash) {
          pos++;
          continue;
        }
        result += input.substring(start, pos);
        if (pos === end - 1) {
          error({ code: "invalid-escape-sequence" }, pos, pos);
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
          // This keeps program behavior unchanged by line-ending conversion.
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
    indentationEnd: number,
  ): number {
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

  function unescapeString(start: number, end: number): string {
    let result = "";
    let pos = start;

    while (pos < end) {
      const ch = input.charCodeAt(pos);
      if (ch !== CharCode.Backslash) {
        pos++;
        continue;
      }

      if (pos === end - 1) {
        error({ code: "invalid-escape-sequence" }, pos, pos);
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

  function unescapeOne(pos: number): string {
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
      case CharCode.$:
        return "$";
      case CharCode.At:
        return "@";
      case CharCode.Backtick:
        return "`";
      default:
        error({ code: "invalid-escape-sequence" }, pos, pos + 2);
        return String.fromCharCode(ch);
    }
  }

  function scanIdentifierOrKeyword(): Token {
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

  function scanIdentifier(): Token.Identifier {
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

  function scanBacktickedIdentifier(): Token.Identifier {
    position++; // consume '`'

    tokenFlags |= TokenFlags.Backticked;

    loop: for (; !eof(); position++) {
      const ch = input.charCodeAt(position);
      switch (ch) {
        case CharCode.Backslash:
          position++;
          tokenFlags |= TokenFlags.Escaped;
          continue;
        case CharCode.Backtick:
          position++;
          return (token = Token.Identifier);
        case CharCode.CarriageReturn:
        case CharCode.LineFeed:
          break loop;
        default:
          if (ch > CharCode.MaxAscii) {
            tokenFlags |= TokenFlags.NonAscii;
          }
      }
    }

    return unterminated(Token.Identifier);
  }

  function scanNonAsciiIdentifier(startCodePoint: number): Token.Identifier {
    tokenFlags |= TokenFlags.NonAscii;
    let cp = startCodePoint;
    do {
      position += utf16CodeUnits(cp);
    } while (!eof() && isIdentifierContinue((cp = input.codePointAt(position)!)));

    return (token = Token.Identifier);
  }

  function atConflictMarker(): boolean {
    return isConflictMarker(input, position, endPosition);
  }

  function scanConflictMarker(): Token.ConflictMarker {
    const marker = input.charCodeAt(position);
    position += mergeConflictMarkerLength;
    error({ code: "conflict-marker" });

    if (marker === CharCode.LessThan || marker === CharCode.GreaterThan) {
      // Consume everything from >>>>>>> or <<<<<<< to the end of the line.
      while (position < endPosition && !isLineBreak(input.charCodeAt(position))) {
        position++;
      }
    } else {
      // Consume everything from the start of a ||||||| or =======
      // marker to the start of the next ======= or >>>>>>> marker.
      while (position < endPosition) {
        const ch = input.charCodeAt(position);
        if (
          (ch === CharCode.Equals || ch === CharCode.GreaterThan) &&
          ch !== marker &&
          isConflictMarker(input, position, endPosition)
        ) {
          break;
        }
        position++;
      }
    }

    return (token = Token.ConflictMarker);
  }
}

/**
 *
 * @param script
 * @param position
 * @param endPosition exclude
 * @returns return === endPosition (or -1) means not found non-trivia until endPosition + 1
 */
export function skipTriviaBackward(
  script: TypeSpecScriptNode,
  position: number,
  endPosition = -1,
): number {
  endPosition = endPosition < -1 ? -1 : endPosition;
  const input = script.file.text;
  if (position === input.length) {
    // it's possible if the pos is at the end of the file, just treat it as trivia
    position--;
  } else if (position > input.length) {
    compilerAssert(false, "position out of range");
  }

  while (position > endPosition) {
    const ch = input.charCodeAt(position);

    if (isWhiteSpace(ch)) {
      position--;
    } else {
      const comment = getCommentAtPosition(script, position);
      if (comment) {
        position = comment.pos - 1;
      } else {
        break;
      }
    }
  }

  return position;
}

/**
 *
 * @param input
 * @param position
 * @param endPosition exclude
 * @returns return === endPosition (or input.length) means not found non-trivia until endPosition - 1
 */
export function skipTrivia(input: string, position: number, endPosition = input.length): number {
  endPosition = endPosition > input.length ? input.length : endPosition;
  while (position < endPosition) {
    const ch = input.charCodeAt(position);

    if (isWhiteSpace(ch)) {
      position++;
      continue;
    }

    if (ch === CharCode.Slash) {
      switch (input.charCodeAt(position + 1)) {
        case CharCode.Slash:
          position = skipSingleLineComment(input, position, endPosition);
          continue;
        case CharCode.Asterisk:
          position = skipMultiLineComment(input, position, endPosition)[0];
          continue;
      }
    }

    break;
  }

  return position;
}

export function skipWhiteSpace(
  input: string,
  position: number,
  endPosition = input.length,
): number {
  while (position < endPosition) {
    const ch = input.charCodeAt(position);

    if (!isWhiteSpace(ch)) {
      break;
    }
    position++;
  }

  return position;
}

function skipSingleLineComment(
  input: string,
  position: number,
  endPosition = input.length,
): number {
  position += 2; // consume '//'

  for (; position < endPosition; position++) {
    if (isLineBreak(input.charCodeAt(position))) {
      break;
    }
  }

  return position;
}

function skipMultiLineComment(
  input: string,
  position: number,
  endPosition = input.length,
): [position: number, terminated: boolean] {
  position += 2; // consume '/*'

  for (; position < endPosition; position++) {
    if (
      input.charCodeAt(position) === CharCode.Asterisk &&
      input.charCodeAt(position + 1) === CharCode.Slash
    ) {
      return [position + 2, true];
    }
  }

  return [position, false];
}

export function skipContinuousIdentifier(input: string, position: number, isBackward = false) {
  let cur = position;
  const direction = isBackward ? -1 : 1;
  const bar = isBackward ? (p: number) => p >= 0 : (p: number) => p < input.length;
  while (bar(cur)) {
    const { char: cp, size } = codePointBefore(input, cur);
    cur += direction * size;
    if (!cp || !isIdentifierContinue(cp)) {
      break;
    }
  }
  return cur;
}

function isConflictMarker(input: string, position: number, endPosition = input.length): boolean {
  // Conflict markers must be at the start of a line.
  const ch = input.charCodeAt(position);
  if (position === 0 || isLineBreak(input.charCodeAt(position - 1))) {
    if (position + mergeConflictMarkerLength < endPosition) {
      for (let i = 0; i < mergeConflictMarkerLength; i++) {
        if (input.charCodeAt(position + i) !== ch) {
          return false;
        }
      }
      return (
        ch === CharCode.Equals ||
        input.charCodeAt(position + mergeConflictMarkerLength) === CharCode.Space
      );
    }
  }

  return false;
}

function getTokenDisplayTable(entries: [Token, string][]): readonly string[] {
  const table = new Array<string>(entries.length);

  for (const [token, display] of entries) {
    compilerAssert(
      token >= 0 && token < Token.__Count,
      `Invalid entry in token display table, ${token}, ${Token[token]}, ${display}`,
    );
    compilerAssert(
      !table[token],
      `Duplicate entry in token display table for: ${token}, ${Token[token]}, ${display}`,
    );
    table[token] = display;
  }

  for (let token = 0; token < Token.__Count; token++) {
    compilerAssert(table[token], `Missing entry in token display table: ${token}, ${Token[token]}`);
  }

  return table;
}
