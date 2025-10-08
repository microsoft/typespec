import { Experimental_OverridableComponent } from "#core/index.js";
import { code, type Children } from "@alloy-js/core";
import { Reference } from "@alloy-js/csharp";
import {
  getTypeName,
  isVoidType,
  type IntrinsicType,
  type Scalar,
  type Type,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "../../core/index.js";
import { reportTypescriptDiagnostic } from "../../typescript/lib.js";
import { getNullableUnionInnerType } from "./utils/nullable-util.js";
import { efRefkey } from "./utils/refkey.js";

export interface TypeExpressionProps {
  type: Type;
}

export function TypeExpression(props: TypeExpressionProps): Children {
  if (props.type.kind === "Union") {
    const nullabletype = getNullableUnionInnerType(props.type);
    if (nullabletype) {
      return code`${(<TypeExpression type={nullabletype} />)}?`;
    }
  }
  const { $ } = useTsp();
  if (isDeclaration($, props.type)) {
    return (
      <Experimental_OverridableComponent reference type={props.type}>
        <Reference refkey={efRefkey(props.type)} />
      </Experimental_OverridableComponent>
    );
  }
  if ($.scalar.is(props.type)) {
    return getScalarIntrinsicExpression($, props.type);
  } else if ($.array.is(props.type)) {
    return code`${(<TypeExpression type={props.type.indexer.value} />)}[]`;
  } else if ($.record.is(props.type)) {
    return code`IDictionary<string, ${(<TypeExpression type={props.type.indexer.value} />)}>`;
  } else if ($.literal.isString(props.type)) {
    // c# doesn't have literal types, so we map them to their corresponding C# types in general
    return code`string`;
  } else if ($.literal.isNumeric(props.type)) {
    return Number.isInteger(props.type.value) ? code`int` : code`double`;
  } else if ($.literal.isBoolean(props.type)) {
    return code`bool`;
  } else if (isVoidType(props.type)) {
    return code`void`;
  }

  return (
    <Experimental_OverridableComponent reference type={props.type}>
      <ErrorComponent kind={props.type.kind} type={props.type} />
    </Experimental_OverridableComponent>
  );
}

function ErrorComponent(props: { kind: string; type: Type }): Children {
  throw new Error(
    `Unsupported type for TypeExpression: ${props.type.kind} (${getTypeName(props.type)})`,
  );
}

const intrinsicNameToCSharpType = new Map<string, string | null>([
  // Core types
  ["unknown", "object"], // Matches C#'s `object`
  ["string", "string"], // Matches C#'s `string`
  ["boolean", "bool"], // Matches C#'s `bool`
  ["null", "null"], // Matches C#'s `null`
  ["void", "void"], // Matches C#'s `void`
  ["never", null], // No direct equivalent in C#
  ["bytes", "byte[]"], // Matches C#'s `byte[]`

  // Numeric types
  ["numeric", "decimal"], // Parent type for all numeric types, use most precise
  ["integer", "int"], // Broad integer category, maps to `int`
  ["float", "float"], // Broad float category, maps to `float`
  ["decimal", "decimal"], // Broad decimal category, maps to `decimal`
  ["decimal128", "decimal"], // C#'s decimal is 128-bit
  ["int64", "long"], // 64-bit signed integer
  ["int32", "int"], // 32-bit signed integer
  ["int16", "short"], // 16-bit signed integer
  ["int8", "sbyte"], // 8-bit signed integer
  ["safeint", "int"], // Safe integer, use int as default
  ["uint64", "ulong"], // 64-bit unsigned integer
  ["uint32", "uint"], // 32-bit unsigned integer
  ["uint16", "ushort"], // 16-bit unsigned integer
  ["uint8", "byte"], // 8-bit unsigned integer
  ["float32", "float"], // 32-bit floating point
  ["float64", "double"], // 64-bit floating point

  // Date and time types
  ["plainDate", "DateOnly"], // Use .NET 6+ DateOnly for plain calendar dates
  ["plainTime", "TimeOnly"], // Use .NET 6+ TimeOnly for plain clock times
  ["utcDateTime", "DateTimeOffset"], // Use DateTimeOffset for UTC date-times
  ["offsetDateTime", "DateTimeOffset"], // Use DateTimeOffset for timezone-specific date-times
  ["duration", "TimeSpan"], // Duration as TimeSpan

  // String types
  ["url", "Uri"], // Matches C#'s `Uri`
]);

export function getScalarIntrinsicExpression(
  $: Typekit,
  type: Scalar | IntrinsicType,
): string | null {
  let intrinsicName: string;

  if ($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
    return "DateTimeOffset";
  }
  if ($.scalar.is(type)) {
    intrinsicName = $.scalar.getStdBase(type)?.name ?? "";
  } else {
    intrinsicName = type.name;
  }

  const csType = intrinsicNameToCSharpType.get(intrinsicName);

  if (!csType) {
    reportTypescriptDiagnostic($.program, { code: "typescript-unsupported-scalar", target: type });
    return "object"; // Fallback to object if unsupported
  }

  return csType;
}

function isDeclaration($: Typekit, type: Type): boolean {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
    case "EnumMember":
      return true;
    case "UnionVariant":
      return false;

    case "Model":
      if ($.array.is(type) || $.record.is(type)) {
        return false;
      }
      return true;
    case "Union":
      return Boolean(type.name);
    default:
      return false;
  }
}

export { intrinsicNameToCSharpType };
