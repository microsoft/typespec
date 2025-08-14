import { For } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { IntrinsicType, Model, Scalar, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import "@typespec/http/experimental/typekit";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportPythonDiagnostic } from "../../../python/lib.js";
import { datetimeModule, decimalModule, typingModule } from "../../builtins.js";
import { efRefkey } from "../../utils/refkey.js";
import { ArrayExpression } from "../array-expression/array-expression.js";
import { RecordExpression } from "../record-expression/record-expression.js";

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
  const type = $.httpPart.unpack(props.type);
  if (!props.noReference && isDeclaration($, type)) {
    return <py.Reference refkey={efRefkey(type)} />;
  }

  // TODO: Make sure this is an exhaustive switch, including EnumMember and such
  switch (type.kind) {
    case "Scalar": // Custom types based on primitives (Intrinsics)
    case "Intrinsic": // Language primitives like `string`, `number`, etc.
      return <>{getScalarIntrinsicExpression($, type)}</>;
    case "Boolean":
    case "Number":
    case "String":
      return <py.Atom jsValue={type.value} />;
    case "Tuple":
      return (
        <>
          {typingModule["."]["Tuple"]}[
          <For each={type.values} comma space>
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

      if ($.httpPart.is(type)) {
        const partType = $.httpPart.unpack(type);
        return <TypeExpression type={partType} />;
      }

    // TODO: Models will be implemented separately
    // return <InterfaceExpression type={type} />;
    // TODO: Functions will be implemented separately
    // case "Operation":
    //   return <FunctionType type={type} />;
    default:
      reportPythonDiagnostic($.program, { code: "python-unsupported-type", target: type });
      return "any";
  }
}

const intrinsicNameToPythonType = new Map<string, string | null>([
  // Core types
  ["unknown", "Any"], // Matches Python's `Any`
  ["string", "str"], // Matches Python's `str`
  ["boolean", "bool"], // Matches Python's `bool`
  ["null", "None"], // Matches Python's `None`
  ["void", "None"], // Matches Python's `None`
  ["never", "NoReturn"], // Matches Python's `NoReturn`
  ["bytes", "bytes"], // Matches Python's `bytes`

  // Numeric types
  ["numeric", "number"], // Parent type for all numeric types
  ["integer", "int"], // Broad integer category, maps to `int`
  ["float", "float"], // Broad float category, maps to `float`
  ["decimal", "Decimal"], // Broad decimal category, maps to `Decimal`
  ["decimal128", "Decimal"], // 128-bit decimal category, maps to `Decimal`
  ["int64", "int"], // Use `int` to handle large 64-bit integers
  ["int32", "int"], // 32-bit integer fits in Python's `int`
  ["int16", "int"], // 16-bit integer
  ["int8", "int"], // 8-bit integer
  ["safeint", "int"], // Safe integer fits within Python limits
  ["uint64", "int"], // Use `int` for unsigned 64-bit integers
  ["uint32", "int"], // 32-bit unsigned integer
  ["uint16", "int"], // 16-bit unsigned integer
  ["uint8", "int"], // 8-bit unsigned integer
  ["float32", "float"], // Maps to Python's `float`
  ["float64", "float"], // Maps to Python's `float`.

  // Date and time types
  ["plainDate", "str"], // Use `str` for plain calendar dates
  ["plainTime", "str"], // Use `str` for plain clock times
  ["utcDateTime", "datetime"], // Use `datetime` for UTC date-times
  ["offsetDateTime", "str"], // Use `str` for timezone-specific date-times
  ["duration", "str"], // Duration as an ISO 8601 string or custom format

  // String types
  ["url", "str"], // Matches Python's `str`
]);

const pythonTypeToImport = new Map<string, any>([
  ["Any", typingModule["."]["Any"]],
  ["NoReturn", typingModule["."]["NoReturn"]],
  ["Tuple", typingModule["."]["Tuple"]],
  ["datetime", datetimeModule["."]["datetime"]],
  ["Decimal", decimalModule["."]["Decimal"]],
]);

function getScalarIntrinsicExpression($: Typekit, type: Scalar | IntrinsicType): string | null {
  let intrinsicName: string;
  if ($.scalar.is(type)) {
    if ($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
      const encoding = $.scalar.getEncoding(type);
      intrinsicName = "utcDateTime";
      switch (encoding?.encoding) {
        case "unixTimestamp":
        case "rfc7231":
        case "rfc3339":
        default:
          intrinsicName = `utcDateTime`;
          break;
      }
    }
    intrinsicName = $.scalar.getStdBase(type)?.name ?? "";
  } else {
    intrinsicName = type.name;
  }

  let pythonType = intrinsicNameToPythonType.get(intrinsicName);
  const importModule = pythonTypeToImport.get(pythonType ?? "");
  pythonType = importModule ? importModule : pythonType;

  if (!pythonType) {
    reportPythonDiagnostic($.program, { code: "python-unsupported-scalar", target: type });
    return "any";
  }

  return pythonType;
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
