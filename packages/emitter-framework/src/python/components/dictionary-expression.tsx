import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.jsx";

export interface DictionaryExpressionModel {
  /** The value type of the Dictionary. */
  type: Type;
}

export function DictionaryExpression({ type }: DictionaryExpressionModel) {
  // COMMENT: Python dictionaries can have keys other than string (any hashable type),
  // but TypeSpec Record types are always string-keyed. If this is important to
  // Python we would need a mechanism to override the key type. For now it's just
  // assumed to be string.
  return (
    <>
      Dict[ str, <TypeExpression type={type} /> ]
    </>
  );
}
