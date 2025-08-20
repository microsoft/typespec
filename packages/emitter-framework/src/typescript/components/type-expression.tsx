import { Experimental_OverridableComponent } from "#core/index.js";
import { For } from "@alloy-js/core";
import { Reference, ValueExpression } from "@alloy-js/typescript";
import type { IntrinsicType, Model, Scalar, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "../../core/context/tsp-context.js";
import { reportTypescriptDiagnostic } from "../../typescript/lib.js";
import { efRefkey } from "../utils/refkey.js";
import { ArrayExpression } from "./array-expression.js";
import { FunctionType } from "./function-type.js";
import { InterfaceExpression } from "./interface-declaration.js";
import { RecordExpression } from "./record-expression.js";
import { UnionExpression } from "./union/expression.js";

export interface TypeExpressionProps {
  type: Type;

  /**
   * Whether to disallow references. Setting this will force the type to be
   * emitted inline, even if it is a declaration that would otherwise be
   * referenced.
   */
  noReference?: boolean;
}

export function TypeExpression(props: TypeExpressionProps) {
  const { $ } = useTsp();
  const type = props.type;
  if (!props.noReference && isDeclaration($, type)) {
    // todo: probably need abstraction around deciding what's a declaration in the output
    // (it may not correspond to things which are declarations in TypeSpec?)
    return (
      <Experimental_OverridableComponent reference type={type}>
        <Reference refkey={efRefkey(type)} />
      </Experimental_OverridableComponent>
    );
    //throw new Error("Reference not implemented");
  }

  // TODO: Make sure this is an exhaustive switch, including EnumMember and such
  switch (type.kind) {
    case "Scalar":
    case "Intrinsic":
      return <>{getScalarIntrinsicExpression($, type)}</>;
    case "Boolean":
    case "Number":
    case "String":
      return <ValueExpression jsValue={type.value} />;
    case "Union":
      return <UnionExpression type={type} />;
    case "UnionVariant":
      return <TypeExpression type={type.type} />;
    case "Tuple":
      return (
        <>
          [
          <For each={type.values} comma line>
            {(element) => <TypeExpression type={element} />}
          </For>
          ]
        </>
      );
    case "ModelProperty":
      return <TypeExpression type={type.type} />;
    case "Model":
      if ($.array.is(type)) {
        const elementType = type.indexer!.value;
        return <ArrayExpression elementType={elementType} />;
      }

      if ($.record.is(type)) {
        const elementType = (type as Model).indexer!.value;
        return <RecordExpression elementType={elementType} />;
      }

      return <InterfaceExpression type={type} />;
    case "Operation":
      return <FunctionType type={type} />;
    default:
      reportTypescriptDiagnostic($.program, { code: "typescript-unsupported-type", target: type });
      return "any";
  }
}

const intrinsicNameToTSType = new Map<string, string | null>([
  // Core types
  ["unknown", "unknown"], // Matches TypeScript's `unknown`
  ["string", "string"], // Matches TypeScript's `string`
  ["boolean", "boolean"], // Matches TypeScript's `boolean`
  ["null", "null"], // Matches TypeScript's `null`
  ["void", "void"], // Matches TypeScript's `void`
  ["never", "never"], // Matches TypeScript's `never`
  ["bytes", "Uint8Array"], // Matches TypeScript's `Uint8Array`

  // Numeric types
  ["numeric", "number"], // Parent type for all numeric types
  ["integer", "number"], // Broad integer category, maps to `number`
  ["float", "number"], // Broad float category, maps to `number`
  ["decimal", "number"], // Broad decimal category, maps to `number`
  ["decimal128", "number"], // May use libraries for precision
  ["int64", "bigint"], // Use `bigint` to handle large 64-bit integers
  ["int32", "number"], // 32-bit integer fits in JavaScript's `number`
  ["int16", "number"], // 16-bit integer
  ["int8", "number"], // 8-bit integer
  ["safeint", "number"], // Safe integer fits within JavaScript limits
  ["uint64", "bigint"], // Use `bigint` for unsigned 64-bit integers
  ["uint32", "number"], // 32-bit unsigned integer
  ["uint16", "number"], // 16-bit unsigned integer
  ["uint8", "number"], // 8-bit unsigned integer
  ["float32", "number"], // Maps to JavaScript's `number`
  ["float64", "number"], // Maps to JavaScript's `number`

  // Date and time types
  ["plainDate", "string"], // Use `string` for plain calendar dates
  ["plainTime", "string"], // Use `string` for plain clock times
  ["utcDateTime", "Date"], // Use `Date` for UTC date-times
  ["offsetDateTime", "string"], // Use `string` for timezone-specific date-times
  ["duration", "string"], // Duration as an ISO 8601 string or custom format

  // String types
  ["url", "string"], // Matches TypeScript's `string`
]);

function getScalarIntrinsicExpression($: Typekit, type: Scalar | IntrinsicType): string | null {
  let intrinsicName: string;
  if ($.scalar.is(type)) {
    if ($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
      const encoding = $.scalar.getEncoding(type);
      let emittedType = "Date";
      switch (encoding?.encoding) {
        case "unixTimestamp":
        case "rfc7231":
        case "rfc3339":
        default:
          emittedType = `Date`;
          break;
      }

      return emittedType;
    }

    intrinsicName = $.scalar.getStdBase(type)?.name ?? "";
  } else {
    intrinsicName = type.name;
  }

  const tsType = intrinsicNameToTSType.get(intrinsicName);

  if (!tsType) {
    reportTypescriptDiagnostic($.program, { code: "typescript-unsupported-scalar", target: type });
    return "any";
  }

  return tsType;
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

      return Boolean(type.name);
    case "Union":
      return Boolean(type.name);
    default:
      return false;
  }
}
