import { Message } from "./types";

export const messages: { [key: string]: Message } = {
  // Scanner errors
  DigitExpected: { code: 1100, category: 'error', text: 'Digit expected (0-9)' },
  HexDigitExpected: { code: 1101, category: 'error', text: 'Hex Digit expected (0-F,0-f)' },
  BinaryDigitExpected: { code: 1102, category: 'error', text: 'Binary Digit expected (0,1)' },
  UnexpectedEndOfFile: { code: 1103, category: 'error', text: 'Unexpected end of file while searching for \'{0}\'' },
  InvalidEscapeSequence: { code: 1104, category: 'error', text: 'Invalid escape sequence' },
  NoNewLineAtStartOfTripleQuotedString: { code: 1105, category: 'error', text: 'String content in triple quotes must begin on a new line' },
  NoNewLineAtEndOfTripleQuotedString: { code: 1106, category: 'error', text: 'Closing triple quotes must begin on a new line' },
  InconsistentTripleQuoteIndentation: { code: 1107, category: 'error', text: 'All lines in triple-quoted string lines must have the same indentation as closing triple quotes' },
  UnexpectedToken: { code: 1108, category: 'error', text: 'Unexpected token: \'{0}\'' },
};
