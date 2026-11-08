import type { SymbolCreator } from "@alloy-js/core";
import { createModule } from "@alloy-js/python";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type dummy = SymbolCreator;

/** Importable `abc.ABC` symbol used by abstract class bases; referencing it lets Alloy manage the import. */
export const abcModule = createModule({
  name: "abc",
  descriptor: {
    ".": ["ABC"],
  },
});

/** Importable datetime/date/time/timedelta/timezone symbols, accessed through the module's `"."` descriptor. */
export const datetimeModule = createModule({
  name: "datetime",
  descriptor: {
    ".": ["datetime", "date", "time", "timedelta", "timezone"],
  },
});

/** Importable `decimal.Decimal` symbol used when rendering decimal scalar types. */
export const decimalModule = createModule({
  name: "decimal",
  descriptor: {
    ".": ["Decimal"],
  },
});

/** Shared importable typing symbols for generated annotations, aliases, protocols, and generic expressions. */
export const typingModule = createModule({
  name: "typing",
  descriptor: {
    ".": [
      "Annotated",
      "Any",
      "Callable",
      "ClassVar",
      "Generic",
      "Literal",
      "Never",
      "Optional",
      "Protocol",
      "TypeAlias",
      "TypeVar",
      "Union",
    ],
  },
});
