export interface Message {
  code?: number;
  text: string;
  severity: "error" | "warning";
}

export const Message = {
  DigitExpected: {
    code: 1100,
    severity: "error",
    text: "Digit expected (0-9)",
  } as const,

  HexDigitExpected: {
    code: 1101,
    severity: "error",
    text: "Hex Digit expected (0-F)",
  } as const,

  BinaryDigitExpected: {
    code: 1102,
    severity: "error",
    text: "Binary Digit expected (0,1)",
  } as const,

  UnexpectedEndOfFile: {
    code: 1103,
    severity: "error",
    text: "Unexpected end of file while searching for '{0}'",
  } as const,

  InvalidEscapeSequence: {
    code: 1104,
    severity: "error",
    text: "Invalid escape sequence",
  } as const,

  NoNewLineAtStartOfTripleQuotedString: {
    code: 1105,
    severity: "error",
    text: "String content in triple quotes must begin on a new line",
  } as const,

  NoNewLineAtEndOfTripleQuotedString: {
    code: 1106,
    severity: "error",
    text: "Closing triple quotes must begin on a new line",
  } as const,

  InconsistentTripleQuoteIndentation: {
    code: 1107,
    severity: "error",
    text:
      "All lines in triple-quoted string lines must have the same indentation as closing triple quotes",
  } as const,

  InvalidCharacter: {
    code: 1108,
    severity: "error",
    text: "Invalid character.",
  } as const,
};

// Static assert: this won't compile if one of the entries above is invalid.
// Having the properties typed as const there instead of Message makes it easier
// to see the message text by hovering in the IDE and also happens to be fewer
// keystrokes.
const assertMessageType: { [K in keyof typeof Message]: Message } = Message;
