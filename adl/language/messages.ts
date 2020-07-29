interface Dictionary<T> {
  [key: string]: T;
}

export enum MessageCategory {
  Warning,
  Error,
  Suggestion,
  Message
}
export interface Message {
  code: number;
  category: MessageCategory;
  text: string;
}

export const messages = {
  DigitExpected: { code: 1100, category: MessageCategory.Error, text: 'Digit expected (0-9)' },
  HexDigitExpected: { code: 1101, category: MessageCategory.Error, text: 'Hex Digit expected (0-F,0-f)' },
  BinaryDigitExpected: { code: 1102, category: MessageCategory.Error, text: 'Binary Digit expected (0,1)' },
  UnexpectedEndOfFile: { code: 1103, category: MessageCategory.Error, text: 'Unexpected end of file while searching for \'{0}\'' },
};

export function format(text: string, ...args: Array<string | number>): string {
  return text.replace(/{(\d+)}/g, (_match, index: string) => '' + args[+index] || '<ARGMISSING>');
}