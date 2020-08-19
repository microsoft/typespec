import { CharacterCodes, isBinaryDigit, isDigit, isHexDigit, isIdentifierPart, isIdentifierStart, isLineBreak, isWhiteSpaceSingleLine, sizeOf } from './character-codes.js';
import { format, Message, messages } from './messages.js';

// All conflict markers consist of the same character repeated seven times.  If it is
// a <<<<<<< or >>>>>>> marker then it is also followed by a space.
const mergeConflictMarkerLength = 7;

/**
 * Position in a text document expressed as zero-based line and character offset.
 * The offsets are based on a UTF-16 string representation. So a string of the form
 * `a𐐀b` the character offset of the character `a` is 0, the character offset of `𐐀`
 * is 1 and the character offset of b is 3 since `𐐀` is represented using two code
 * units in UTF-16.
 *
 * Positions are line end character agnostic. So you can not specify a position that
 * denotes `\r|\n` or `\n|` where `|` represents the character offset.
 */
export interface Position {
  /**
   * Line position in a document (zero-based).
   * If a line number is greater than the number of lines in a document, it defaults back to the number of lines in the document.
   * If a line number is negative, it defaults to 0.
   */
  line: number;
  /**
   * Character offset on a line in a document (zero-based). Assuming that the line is
   * represented as a string, the `character` value represents the gap between the
   * `character` and `character + 1`.
   *
   * If the character value is greater than the line length it defaults back to the
   * line length.
   * If a line number is negative, it defaults to 0.
   */
  character: number;
}

export enum Kind {
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

  BigIntLiteral,
  StringLiteral,
  RegularExpressionLiteral,
  NoSubstitutionTemplateLiteral,

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
  QuestionDot,
  LessThan,
  LessThanSlash,
  GreaterThan,
  LessThanEquals,
  GreaterThanEquals,
  EqualsEquals,
  ExclamationEquals,
  EqualsEqualsEquals,
  ExclamationEqualsEquals,
  EqualsArrow,
  Plus,
  Minus,
  Asterisk,
  AsteriskAsterisk,
  Slash,
  Percent,
  PlusPlus,
  MinusMinus,
  LessThanLessThan,
  GreaterThanGreaterThan,
  GreaterThanGreaterThanGreaterThan,
  Ampersand,
  Bar,
  Caret,
  Exclamation,
  Tilde,
  AmpersandAmpersand,
  BarBar,
  Question,
  Colon,
  At,
  QuestionQuestion,

  // Assignments
  Equals,
  PlusEquals,
  MinusEquals,
  AsteriskEquals,
  AsteriskAsteriskEquals,
  SlashEquals,
  PercentEquals,
  LessThanLessThanEquals,
  GreaterThanGreaterThanEquals,
  GreaterThanGreaterThanGreaterThanEquals,
  AmpersandEquals,
  BarEquals,
  BarBarEquals,
  AmpersandAmpersandEquals,
  QuestionQuestionEquals,
  CaretEquals,

  // Identifiers
  Identifier,

  // Keywords
  ImportKeyword,
  ModelKeyword,
  InterfaceKeyword,
  AliasKeyword
}

const keywords = new Map([
  ['import', Kind.ImportKeyword],
  ['model', Kind.ModelKeyword],
  ['interface', Kind.InterfaceKeyword],
  ['alias', Kind.AliasKeyword]
]);

interface TokenLocation extends Position {
  offset: number;
}

export class Scanner {
  #offset = 0;
  #line = 0;
  #column = 0;
  #map = new Array<TokenLocation>();

  #length: number;
  #text: string;

  #ch!: number;
  #chNext!: number;
  #chNextNext!: number;

  #chSz!: number;
  #chNextSz!: number;
  #chNextNextSz!: number;

  /** The assumed tab width. If this is set before scanning, it enables accurate Position tracking. */
  tabWidth = 2;

  /**
     The current state of the scanner.
     Will be set to `error` when the scanner is in an error state
  */
  state?: 'error';

  // current token information

  /** the character offset within the document */
  offset!: number;

  /** the token kind */
  token!: Kind;

  /** the text of the current token (when appropriate) */
  value!: string;

  /** returns the Position (line/column) of the current token */
  get position(): Position {
    return this.positionFromOffset(this.offset);
  }

  constructor(text: string) {
    this.#text = text;
    this.#length = text.length;
    this.advance(0);
    this.markPosition();
  }

  get eof() {
    return this.#offset >= this.#length;
  }

  private advance(count?: number): number {
    let codeOrChar: number;
    let newOffset: number;
    let offsetAdvancedBy = 0;

    switch (count) {
      case undefined:
      case 1:
        offsetAdvancedBy = this.#chSz;
        this.#offset += this.#chSz;
        this.#ch = this.#chNext; this.#chSz = this.#chNextSz;
        this.#chNext = this.#chNextNext; this.#chNextSz = this.#chNextNextSz;

        newOffset = this.#offset + this.#chSz + this.#chNextSz;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#chNextNext = (this.#chNextNextSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;
        return offsetAdvancedBy;

      case 2:
        offsetAdvancedBy = this.#chSz + this.#chNextSz;
        this.#offset += this.#chSz + this.#chNextSz;
        this.#ch = this.#chNextNext; this.#chSz = this.#chNextNextSz;

        newOffset = this.#offset + this.#chSz;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#chNext = (this.#chNextSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;

        newOffset += this.#chNextSz;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#chNextNext = (this.#chNextNextSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;
        return offsetAdvancedBy;

      default:
      case 3:
        offsetAdvancedBy = this.#chSz + this.#chNextSz + this.#chNextNextSz;
        count -= 3;
        while (count) {
          // skip over characters while we work.
          offsetAdvancedBy += sizeOf(this.#text.charCodeAt(this.#offset + offsetAdvancedBy));
        }
        this.#offset += offsetAdvancedBy;

      // eslint-disable-next-line no-fallthrough
      case 0:
        newOffset = this.#offset;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#ch = (this.#chSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;

        newOffset += this.#chSz;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#chNext = (this.#chNextSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;

        newOffset += this.#chNextSz;
        codeOrChar = this.#text.charCodeAt(newOffset);
        this.#chNextNext = (this.#chNextNextSz = sizeOf(codeOrChar)) === 1 ? codeOrChar : this.#text.codePointAt(newOffset)!;
        return offsetAdvancedBy;
    }
  }

  private next(token: Kind, count = 1, value?: string) {
    const originalOffset = this.#offset;
    const offsetAdvancedBy = this.advance(count);
    this.value = value || this.#text.substr(originalOffset, offsetAdvancedBy);

    this.#column += count;
    return this.token = token;
  }

  /** adds the current position to the token to the offset:position map */
  private markPosition() {
    this.#map.push({ offset: this.#offset, character: this.#column, line: this.#line });
  }

  /** updates the position and marks the location  */
  private newLine(count = 1) {
    this.value = this.#text.substr(this.#offset, count);
    this.advance(count);

    this.#line++;
    this.#column = 0;
    this.markPosition(); // make sure the map has the new location

    return this.token = Kind.NewLine;
  }

  /**
   * Identifies and returns the next token type in the document
   *
   * @returns the state of the scanner will have the properties `token`, `value`, `offset` pointing to the current token at the end of this call.
   *
   * @notes before this call, `#offset` is pointing to the next character to be evaluated.
   *
   */
  scan(): Kind {

    // this token starts at
    this.offset = this.#offset;

    if (!this.eof) {
      switch (this.#ch) {
        case CharacterCodes.carriageReturn:
          return this.newLine(this.#chNext === CharacterCodes.lineFeed ? 2 : 1);

        case CharacterCodes.lineFeed:
          return this.newLine();

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
          return this.scanWhitespace();

        case CharacterCodes.openParen:
          return this.next(Kind.OpenParen);

        case CharacterCodes.closeParen:
          return this.next(Kind.CloseParen);

        case CharacterCodes.comma:
          return this.next(Kind.Comma);

        case CharacterCodes.colon:
          return this.next(Kind.Colon);

        case CharacterCodes.semicolon:
          return this.next(Kind.Semicolon);

        case CharacterCodes.openBracket:
          return this.next(Kind.OpenBracket);

        case CharacterCodes.closeBracket:
          return this.next(Kind.CloseBracket);

        case CharacterCodes.openBrace:
          return this.next(Kind.OpenBrace);

        case CharacterCodes.closeBrace:
          return this.next(Kind.CloseBrace);

        case CharacterCodes.tilde:
          return this.next(Kind.Tilde);

        case CharacterCodes.at:
          return this.next(Kind.At);

        case CharacterCodes.caret:
          return this.#chNext === CharacterCodes.equals ? this.next(Kind.CaretEquals, 2) : this.next(Kind.Caret);

        case CharacterCodes.percent:
          return this.#chNext === CharacterCodes.equals ? this.next(Kind.PercentEquals, 2) : this.next(Kind.Percent);

        case CharacterCodes.question:
          return this.#chNext === CharacterCodes.dot && !isDigit(this.#chNextNext) ?
            this.next(Kind.QuestionDot, 2) :
            this.#chNext === CharacterCodes.question ?
              this.#chNextNext === CharacterCodes.equals ?
                this.next(Kind.QuestionQuestionEquals, 3) :
                this.next(Kind.QuestionQuestion, 2) :
              this.next(Kind.Question);

        case CharacterCodes.exclamation:
          return this.#chNext === CharacterCodes.equals ?
            this.#chNextNext === CharacterCodes.equals ?
              this.next(Kind.ExclamationEqualsEquals, 3) :
              this.next(Kind.ExclamationEquals, 2) :
            this.next(Kind.Exclamation);

        case CharacterCodes.ampersand:
          return this.#chNext === CharacterCodes.ampersand ?
            this.#chNextNext === CharacterCodes.equals ?
              this.next(Kind.AmpersandAmpersandEquals, 3) :
              this.next(Kind.AmpersandAmpersand, 2) :
            this.#chNext === CharacterCodes.equals ?
              this.next(Kind.AmpersandEquals, 2) :
              this.next(Kind.Ampersand);

        case CharacterCodes.asterisk:
          return this.#chNext === CharacterCodes.asterisk ?
            this.#chNextNext === CharacterCodes.equals ?
              this.next(Kind.AsteriskAsteriskEquals, 3) :
              this.next(Kind.AsteriskAsterisk, 2) :
            this.#chNext === CharacterCodes.equals ?
              this.next(Kind.AsteriskEquals, 2) :
              this.next(Kind.Asterisk);

        case CharacterCodes.plus:
          return this.#chNext === CharacterCodes.plus ?
            this.next(Kind.PlusPlus, 2) :
            this.#chNext === CharacterCodes.equals ?
              this.next(Kind.PlusEquals, 2) :
              this.next(Kind.Plus);

        case CharacterCodes.minus:
          return this.#chNext === CharacterCodes.minus ?
            this.next(Kind.MinusMinus, 2) :
            this.#chNext === CharacterCodes.equals ?
              this.next(Kind.MinusEquals, 2) :
              this.next(Kind.Minus);

        case CharacterCodes.dot:
          return isDigit(this.#chNext) ?
            this.scanNumber() :
            this.#chNext === CharacterCodes.dot && this.#chNextNext === CharacterCodes.dot ?
              this.next(Kind.Elipsis, 3) :
              this.next(Kind.Dot);

        case CharacterCodes.slash:
          return this.#chNext === CharacterCodes.slash ?
            this.scanSingleLineComment() :
            this.#chNext === CharacterCodes.asterisk ?
              this.scanMultiLineComment() :

              this.#chNext === CharacterCodes.equals ?
                this.next(Kind.SlashEquals) :
                this.next(Kind.Slash);

        case CharacterCodes._0:
          return this.#chNext === CharacterCodes.x || this.#chNext === CharacterCodes.X ?
            this.scanHexNumber() :
            this.#chNext === CharacterCodes.B || this.#chNext === CharacterCodes.B ?
              this.scanBinaryNumber() :
              this.scanNumber();

        case CharacterCodes._1:
        case CharacterCodes._2:
        case CharacterCodes._3:
        case CharacterCodes._4:
        case CharacterCodes._5:
        case CharacterCodes._6:
        case CharacterCodes._7:
        case CharacterCodes._8:
        case CharacterCodes._9:
          return this.scanNumber();

        case CharacterCodes.lessThan:
          return this.isConflictMarker() ?
            this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
            this.#chNext === CharacterCodes.lessThan ?
              this.#chNextNext === CharacterCodes.equals ?
                this.next(Kind.LessThanLessThanEquals, 3) :
                this.next(Kind.LessThanLessThan, 2) :
              this.#chNext === CharacterCodes.equals ?
                this.next(Kind.LessThanEquals, 2) :
                this.next(Kind.LessThan);

        case CharacterCodes.greaterThan:
          return this.isConflictMarker() ?
            this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
            this.next(Kind.GreaterThan);

        case CharacterCodes.equals:
          return this.isConflictMarker() ?
            this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
            this.#chNext === CharacterCodes.equals ?
              this.#chNextNext === CharacterCodes.equals ?
                this.next(Kind.EqualsEqualsEquals, 3) :
                this.next(Kind.EqualsEquals, 2) :
              this.#chNext === CharacterCodes.greaterThan ?
                this.next(Kind.EqualsArrow, 2) :
                this.next(Kind.Equals);

        case CharacterCodes.bar:
          return this.isConflictMarker() ?
            this.next(Kind.ConflictMarker, mergeConflictMarkerLength) :
            this.#chNext === CharacterCodes.bar ?
              this.#chNextNext === CharacterCodes.equals ?
                this.next(Kind.BarBarEquals, 3) :
                this.next(Kind.BarBar, 2) :
              this.#chNext === CharacterCodes.equals ?
                this.next(Kind.BarEquals, 2) :
                this.next(Kind.Bar);

        case CharacterCodes.singleQuote:
        case CharacterCodes.doubleQuote:
        case CharacterCodes.backtick:
          return this.scanString();

        default:
          // FYI:
          // Well-known characters that are currently not processed
          //   # \
          // will need to update the scanner if there is a need to recognize them
          return isIdentifierStart(this.#ch) ? this.scanIdentifier() : this.next(Kind.Unknown);
      }
    }

    this.value = '';
    return this.token = Kind.EndOfFile;
  }
  /**
   * When the current token is greaterThan, this will return any tokens with characters
   * after the greater than character. This has to be scanned separately because greater
   * thans appear in positions where longer tokens are incorrect, e.g. `model x<y>=y;`.
   * The solution is to call rescanGreaterThan from the parser in contexts where longer
   * tokens starting with `>` are allowed (i.e. when parsing binary expressions).
   */
  rescanGreaterThan(): Kind {
    if (this.token === Kind.GreaterThan) {
      return this.#ch === CharacterCodes.greaterThan ?
        this.#chNext === CharacterCodes.equals ?
          this.next(Kind.GreaterThanGreaterThanEquals, 3) :
          this.next(Kind.GreaterThanGreaterThan, 2) :
        this.#ch === CharacterCodes.equals ?
          this.next(Kind.GreaterThanEquals, 2) :
          this.next(Kind.GreaterThan);
    }
    return this.token;
  }

  isConflictMarker() {
    // Conflict markers must be at the start of a line.
    if (this.#offset === 0 || isLineBreak(this.#text.charCodeAt(this.#offset - 1))) {
      if ((this.#offset + mergeConflictMarkerLength) < this.#length) {
        for (let i = 0; i < mergeConflictMarkerLength; i++) {
          if (this.#text.charCodeAt(this.#offset + i) !== this.#ch) {
            return false;
          }
        }
        return this.#ch === CharacterCodes.equals || this.#text.charCodeAt(this.#offset + mergeConflictMarkerLength) === CharacterCodes.space;
      }
    }

    return false;
  }


  private error(msg: Message, ...params: Array<string | number>) {
    console.log(format(msg.text, ...params));
    this.state = 'error';
  }

  private clear() {
    this.state = undefined;
  }

  private scanWhitespace(): Kind {
    // since whitespace are not always 1 character wide, we're going to mark the position before the whitespace.
    this.markPosition();

    do {
      // advance the position
      this.#column += this.widthOfCh;
      this.advance();
    } while (isWhiteSpaceSingleLine(this.#ch));

    // and after...
    this.markPosition();

    this.value = this.#text.substring(this.offset, this.#offset);
    return this.token = Kind.Whitespace;
  }

  private scanDigits(): string {
    const start = this.#offset;
    while (isDigit(this.#ch)) {
      this.advance();
    }
    return this.#text.substring(start, this.#offset);
  }

  private scanNumber() {
    const start = this.#offset;

    const main = this.scanDigits();
    let decimal: string | undefined;
    let scientific: string | undefined;

    if (this.#ch === CharacterCodes.dot) {
      this.advance();
      decimal = this.scanDigits();
    }

    if (this.#ch === CharacterCodes.E || this.#ch === CharacterCodes.e) {
      if (isDigit(this.#chNext)) {
        this.advance();
        scientific = this.scanDigits();
      } else {
        this.error(messages.DigitExpected);
      }
    }

    this.value = scientific ?
      decimal ?
        `${main}.${decimal}e${scientific}` :
        `${main}e${scientific}` :
      decimal ?
        `${main}.${decimal}` :
        main;

    // update the position
    this.#column += (this.#offset - start);
    return this.token = Kind.NumericLiteral;
  }

  private scanHexNumber() {
    if (!isHexDigit(this.#chNextNext)) {
      this.error(messages.HexDigitExpected);
      return this.next(Kind.NumericLiteral, 2);
    }

    this.advance(2);

    this.value = `0x${this.scanUntil((ch) => !isHexDigit(ch), 'Hex Digit')}`;
    return this.token = Kind.NumericLiteral;
  }

  private scanBinaryNumber() {
    if (!isBinaryDigit(this.#chNextNext)) {
      this.error(messages.BinaryDigitExpected);
      return this.next(Kind.NumericLiteral, 2);
    }

    this.advance(2);

    this.value = `0b${this.scanUntil((ch) => !isBinaryDigit(ch), 'Binary Digit')}`;
    return this.token = Kind.NumericLiteral;

  }

  private get widthOfCh() {
    return this.#ch === CharacterCodes.tab ? (this.#column % this.tabWidth || this.tabWidth) : 1;
  }

  private scanUntil(predicate: (char: number, charNext: number, charNextNext: number) => boolean, expectedClose?: string, consumeClose?: number) {
    const start = this.#offset;

    do {
      // advance the position
      if (isLineBreak(this.#ch)) {
        this.advance(this.#ch === CharacterCodes.carriageReturn && this.#chNext === CharacterCodes.lineFeed ? 2 : 1);
        this.#line++;
        this.#column = 0;
        this.markPosition(); // make sure the map has the new location
      } else {
        this.#column += this.widthOfCh;
        this.advance();
      }

      if (this.eof) {
        if (expectedClose) {
          this.error(messages.UnexpectedEndOfFile, expectedClose);
        }
        break;
      }

    } while (!predicate(this.#ch, this.#chNext, this.#chNextNext));

    if (consumeClose) {
      this.advance(consumeClose);
    }

    // and after...
    this.markPosition();

    return this.#text.substring(start, this.#offset);
  }

  private scanSingleLineComment() {
    this.value = this.scanUntil(isLineBreak);
    return this.token = Kind.SingleLineComment;
  }

  private scanMultiLineComment() {
    this.value = this.scanUntil((ch, chNext) => ch === CharacterCodes.asterisk && chNext === CharacterCodes.slash, '*/', 2);
    return this.token = Kind.MultiLineComment;
  }

  private scanString() {
    const startChar = this.#ch;
    let closed = false;
    const closing = String.fromCharCode(this.#ch);

    let isEscaping = false;

    this.value = this.scanUntil((ch, chNext, chNextNext) => {
      if (isEscaping) {
        isEscaping = false;
        return false;
      }

      if (ch === CharacterCodes.backslash) {
        isEscaping = true;
        return false;
      }
      if (closed) {
        return true;
      }
      closed = ch === startChar;
      return false;
    }, closing);
    return this.token = Kind.StringLiteral;
  }

  scanIdentifier() {
    this.value = this.scanUntil((ch) => !isIdentifierPart(ch));
    return this.token = keywords.get(this.value) ?? Kind.Identifier;
  }

  /**
   * Returns the zero-based line/column from the given offset
   * (binary search thru the token start locations)
   * @param offset the character position in the document
   */
  positionFromOffset(offset: number): Position {
    let position = { line: 0, character: 0, offset: 0 };

    // eslint-disable-next-line keyword-spacing
    if (offset < 0 || offset > this.#length) {
      return { line: position.line, character: position.character };
    }

    let first = 0;    //left endpoint
    let last = this.#map.length - 1;   //right endpoint
    let middle = Math.floor((first + last) / 2);

    while (first <= last) {
      middle = Math.floor((first + last) / 2);
      position = this.#map[middle];
      if (position.offset === offset) {
        return { line: position.line, character: position.character };
      }
      if (position.offset < offset) {
        first = middle + 1;
        continue;
      }
      last = middle - 1;
      position = this.#map[last];
    }
    return { line: position.line, character: position.character + (offset - position.offset) };
  }
}