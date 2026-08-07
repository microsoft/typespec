import { Experimental_OverridableComponent } from "#core/index.js";
import { code, type Children } from "@alloy-js/core";
import { Reference } from "@alloy-js/csharp";
import { getTypeName, type IntrinsicType, type Scalar, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "../../core/index.js";
import { reportDiagnostic } from "../../lib.js";
import { getNullableUnionInnerType } from "./utils/nullable-util.js";
import { efRefkey } from "./utils/refkey.js";

export interface TypeExpressionProps {
  type: Type;
}

export function TypeExpression(props: TypeExpressionProps): Children {
  return (
    <Experimental_OverridableComponent reference type={props.type}>
      {() => <TypeExpressionBody type={props.type} />}
    </Experimental_OverridableComponent>
  );
}

/**
 * Resolves a TypeSpec type to the C# type expression that represents it.
 *
 * This never throws: type kinds with no C# equivalent report a diagnostic and fall back to
 * `object`, so that a single unsupported type does not abort the whole emit.
 */
function TypeExpressionBody(props: TypeExpressionProps): Children {
  const { $ } = useTsp();
  const type = props.type;

  switch (type.kind) {
    // Wrappers that carry the type we actually want to render.
    case "ModelProperty":
    case "UnionVariant":
      return <TypeExpression type={type.type} />;

    // C# has no way to type something as one specific enum member, so a property typed
    // `kind: Color.red` is rendered using the enum the member belongs to.
    case "EnumMember":
      return <TypeExpression type={type.enum} />;

    case "Union": {
      const innerType = getNullableUnionInnerType(type);
      if (innerType) {
        return code`${(<TypeExpression type={innerType} />)}?`;
      }
      break; // Named unions are declarations; anything else falls through.
    }

    // C# has no tuple-of-values type; an array of the element type is the closest match.
    case "Tuple":
      return type.values.length > 0
        ? code`${(<TypeExpression type={type.values[0]} />)}[]`
        : code`object[]`;

    case "StringTemplate":
      return "string";

    case "TemplateParameter":
      return getTypeName(type);

    case "Intrinsic":
      return getScalarIntrinsicExpression($, type);
  }

  if (isDeclaration($, type)) {
    return <Reference refkey={efRefkey(type)} />;
  }
  if ($.scalar.is(type)) {
    return getScalarIntrinsicExpression($, type);
  } else if ($.array.is(type)) {
    return code`${(<TypeExpression type={type.indexer.value} />)}[]`;
  } else if ($.record.is(type)) {
    return code`IDictionary<string, ${(<TypeExpression type={type.indexer.value} />)}>`;
  } else if ($.literal.isString(type)) {
    // c# doesn't have literal types, so we map them to their corresponding C# types in general
    return code`string`;
  } else if ($.literal.isNumeric(type)) {
    return Number.isInteger(type.value) ? code`int` : code`double`;
  } else if ($.literal.isBoolean(type)) {
    return code`bool`;
  }

  reportDiagnostic($.program, { code: "csharp-unsupported-type", target: type });
  return "object";
}

const intrinsicNameToCSharpType = new Map<string, string | null>([
  // Core types
  ["unknown", "object"], // Matches C#'s `object`
  ["string", "string"], // Matches C#'s `string`
  ["boolean", "bool"], // Matches C#'s `bool`
  ["null", "object"], // C# has no null type; `object` is the only thing null inhabits
  ["void", "void"], // Matches C#'s `void`
  ["never", "void"], // C# has no bottom type; `void` is the closest equivalent
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

export function getScalarIntrinsicExpression($: Typekit, type: Scalar | IntrinsicType): string {
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
    reportDiagnostic($.program, { code: "csharp-unsupported-scalar", target: type });
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
      return true;

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
