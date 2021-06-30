export interface Message {
  code?: string;
  text: string;
  severity: "error" | "warning";
}

export const Message = {
  DigitExpected: {
    code: "digit-expected",
    severity: "error",
    text: "Digit expected.",
  } as const,

  HexDigitExpected: {
    code: "hex-digit-expected",
    severity: "error",
    text: "Hexadecimal digit expected.",
  } as const,

  BinaryDigitExpected: {
    code: "binary-digit-expected",
    severity: "error",
    text: "Binary digit expected.",
  } as const,

  Unterminated: {
    code: "unterminated",
    severity: "error",
    text: "Unterminated {0}.",
  } as const,

  InvalidEscapeSequence: {
    code: "invalid-escape-sequence",
    severity: "error",
    text: "Invalid escape sequence.",
  } as const,

  NoNewLineAtStartOfTripleQuotedString: {
    code: "no-new-line-start-triple-quote",
    severity: "error",
    text: "String content in triple quotes must begin on a new line.",
  } as const,

  NoNewLineAtEndOfTripleQuotedString: {
    code: "no-new-line-end-triple-quote",
    severity: "error",
    text: "Closing triple quotes must begin on a new line.",
  } as const,

  InconsistentTripleQuoteIndentation: {
    code: "triple-quote-indent",
    severity: "error",
    text:
      "All lines in triple-quoted string lines must have the same indentation as closing triple quotes.",
  } as const,

  InvalidCharacter: {
    code: "invalid-character",
    severity: "error",
    text: "Invalid character.",
  } as const,

  FileNotFound: {
    code: "file-not-found",
    text: `File {0} not found.`,
    severity: "error",
  } as const,
};

// Static assert: this won't compile if one of the entries above is invalid.
// Having the properties typed as const there instead of Message makes it easier
// to see the message text by hovering in the IDE and also happens to be fewer
// keystrokes.
const assertMessageType: { [K in keyof typeof Message]: Message } = Message;
