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

export const pydanticModule = createModule({
  name: "pydantic",
  descriptor: {
    ".": [
      "AfterValidator",
      "BaseModel",
      "BeforeValidator",
      "ConfigDict",
      "EmailStr",
      "Field",
      "HttpUrl",
      "PlainSerializer",
      "RootModel",
      "SecretStr",
      "TypeAdapter",
      "ValidationError",
      "WrapValidator",
      "computed_field",
      "field_serializer",
      "field_validator",
      "model_serializer",
      "model_validator",
    ],
    alias_generators: ["to_camel", "to_pascal", "to_snake"],
    types: ["PositiveFloat", "PositiveInt"],
  },
});

export const pydanticSettingsModule = createModule({
  name: "pydantic_settings",
  descriptor: {
    ".": ["BaseSettings", "SettingsConfigDict"],
  },
});
