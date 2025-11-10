import type { SymbolCreator } from "@alloy-js/core";
import { createModule } from "@alloy-js/python";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type dummy = SymbolCreator;

export const abcModule = createModule({
  name: "abc",
  descriptor: {
    ".": ["ABC"],
  },
});

export const datetimeModule = createModule({
  name: "datetime",
  descriptor: {
    ".": ["datetime", "date", "time", "timedelta", "timezone"],
  },
});

export const decimalModule = createModule({
  name: "decimal",
  descriptor: {
    ".": ["Decimal"],
  },
});

export const typingModule = createModule({
  name: "typing",
  descriptor: {
    ".": [
      "Any",
      "Callable",
      "Generic",
      "Literal",
      "Never",
      "Optional",
      "Protocol",
      "TypeAlias",
      "TypeVar",
      "Tuple",
    ],
  },
});
