import { Children } from "@alloy-js/core";
import { Scalar } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit"

export interface TypeAliasExpressionProps {
  type: Scalar;
  children?: Children;
}

export function TypeAliasExpression({ type }: TypeAliasExpressionProps) {
  if($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
    const encoding =  $.scalar.getEncoding(type);
    let emittedType = "Date";
    switch(encoding?.encoding) {
      case "unixTimestamp":
        emittedType = "number";
        break;
      case "rfc7231":
      case "rfc3339":
      default:
        emittedType = `Date`;
        break;
    }

    return <>{emittedType};</>
  }

   return null;
}
