import { BooleanLiteral, NumericLiteral, StringLiteral } from "@typespec/compiler";

export interface TypeLiteralModel {
  type: BooleanLiteral | StringLiteral | NumericLiteral;
}

export function TypeLiteral({ type }: TypeLiteralModel) {
  // TODO: Need to ensure that `Literal` is imported from `typing`.
  switch (type.kind) {
    case "Boolean":
    case "Number":
      return `Literal[${String(type.value)}]`;
    case "String":
      return `Literal["${type.value}"]`;
  }
}
