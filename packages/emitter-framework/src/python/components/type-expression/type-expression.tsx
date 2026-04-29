import { Experimental_OverridableComponent } from "#core/components/index.js";
import { useTsp } from "#core/context/index.js";
import { reportPythonDiagnostic } from "#python/lib.js";
import { code, For, List, mapJoin } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import {
  isNeverType,
  type IntrinsicType,
  type Model,
  type Scalar,
  type Type,
} from "@typespec/compiler";
import type { TemplateParameterDeclarationNode } from "@typespec/compiler/ast";
import type { Typekit } from "@typespec/compiler/typekit";
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
  const type = props.type;
  if (!props.noReference && isDeclaration($, type)) {
    return (
      <Experimental_OverridableComponent reference type={type}>
        <py.Reference refkey={efRefkey(type)} />
      </Experimental_OverridableComponent>
    );
  }

  switch (type.kind) {
    case "Scalar": // Custom types based on primitives (Intrinsics)
    case "Intrinsic": // Language primitives like `string`, `number`, etc.
      if (isNeverType(type)) {
        return typingModule["."]["Never"];
      }
      return <>{getScalarIntrinsicExpression($, type)}</>;
    case "Boolean":
    case "Number":
    case "String":
      // Single literal values are wrapped in Literal[...]
      return (
        <>
          {typingModule["."]["Literal"]}[{formatLiteralValue(type)}]
        </>
      );
    case "Tuple":
      return (
        <>
          tuple[
          <For each={type.values} comma space>
            {(element) => <TypeExpression type={element} />}
          </For>
          ]
        </>
      );
    case "Union": {
      const variants = Array.from((type as any).variants?.values?.() ?? []);

      // Check if all variants are literals or named union variant refs with literal values
      const isLiteralOrVariantRef = (t: Type): boolean => {
        if (!t) return false;
        if (isLiteral($, t)) return true;
        // Named union variant with a literal inner value
        if (t.kind === "UnionVariant" && (t as any).union?.name) {
          return isLiteral($, (t as any).type);
        }
        return false;
      };

      const innerTypes = variants.map((v: any) => v.type);
      if (innerTypes.every(isLiteralOrVariantRef)) {
        // All literals - render as Literal[...]
        const literalValues = variants
          .map((v: any) => {
            const innerType = v.type;
            // Named union variant ref with literal value
            if (innerType.kind === "UnionVariant" && innerType.union?.name) {
              const variantName = String(innerType.name).toUpperCase();
              return code`${efRefkey(innerType.union)}.${variantName}`;
            }
            if (isLiteral($, innerType)) {
              return formatLiteralValue(innerType);
            }
            return undefined;
          })
          .filter(Boolean);

        return (
          <>
            {typingModule["."]["Literal"]}[<List children={literalValues} joiner=", " />]
          </>
        );
      }

      // Not all literals - render as union type
      return mapJoin(
        () => variants,
        (v: any) => <TypeExpression type={v.type} />,
        { joiner: " | " },
      );
    }
    case "UnionVariant": {
      // Union variant from a named union with a literal value
      if (type.union && (type.union as any).name && isLiteral($, type.type)) {
        // Use the variant's name (e.g., "red", "active"), converted to UPPER_CASE by the enum
        const variantName = String(type.name).toUpperCase();
        return (
          <>
            {typingModule["."]["Literal"]}[{efRefkey(type.union)}.{variantName}]
          </>
        );
      }
      // Unnamed union variant or non-literal value, unwrap to its inner type
      return <TypeExpression type={type.type} />;
    }
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

      // TODO: When TypeSpec adds true generics support, handle generic type references here.
      // Currently, TypeSpec templates are macros that expand to concrete types, so template
      // instances (e.g., Response<string>) are treated as regular concrete types, not as
      // parameterized generic types (e.g., Response[str]).
      // When generics are implemented, this is where we would render: ClassName[TypeArg, ...]

      // Regular named models should be handled as references
      if (type.name) {
        return (
          <Experimental_OverridableComponent reference type={type}>
            <py.Reference refkey={efRefkey(type)} />
          </Experimental_OverridableComponent>
        );
      }

      reportPythonDiagnostic($.program, { code: "python-unsupported-type", target: type });
      return <></>;
    case "TemplateParameter":
      return code`${String((type.node as TemplateParameterDeclarationNode).id.sv)}`;

    case "Operation": {
      // Render function types as typing.Callable[[ArgTypes...], ReturnType]
      // If parameters cannot be enumerated, fall back to Callable[..., ReturnType]
      let paramTypes: Type[] | null;
      const op: any = type as any;
      if (op.parameters) {
        try {
          const { $ } = useTsp();
          const modelProps = $.model.getProperties(op.parameters);
          paramTypes = Array.from(modelProps.values()).map((p: any) => p.type);
        } catch {
          // Unknown/unsupported params shape
          paramTypes = null;
        }
      } else {
        paramTypes = [];
      }

      return (
        <>
          {typingModule["."]["Callable"]}[
          {paramTypes === null ? (
            <>...</>
          ) : paramTypes.length > 0 ? (
            <>
              [
              <For each={paramTypes} comma space>
                {(t) => <TypeExpression type={t} />}
              </For>
              ]
            </>
          ) : (
            <>[]</>
          )}
          {", "}
          <TypeExpression type={(type as any).returnType} />]
        </>
      );
    }
    default:
      reportPythonDiagnostic($.program, { code: "python-unsupported-type", target: type });
      // Return empty fragment - the diagnostic has already been reported
      return <></>;
  }
}

/**
 * Checks if a type is a literal (string, numeric, or boolean).
 */
function isLiteral($: Typekit, type: Type): boolean {
  return $.literal.isString(type) || $.literal.isNumeric(type) || $.literal.isBoolean(type);
}

/**
 * Formats a literal type value for use in Python's Literal[...] syntax.
 */
function formatLiteralValue(type: { kind: string; value: unknown }): string {
  switch (type.kind) {
    case "String":
      return JSON.stringify(type.value);
    case "Boolean":
      return type.value ? "True" : "False";
    case "Number":
      return String(type.value);
    default:
      return String(type.value);
  }
}

const intrinsicNameToPythonType = new Map<string, string | null>([
  // Core types
  ["unknown", "Any"], // Matches Python's `Any`
  ["string", "str"], // Matches Python's `str`
  ["boolean", "bool"], // Matches Python's `bool`
  ["null", "None"], // Matches Python's `None`
  ["void", "None"], // Matches Python's `None`
  ["never", "Never"], // Matches Python's `Never`
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
  ["Never", typingModule["."]["Never"]],
  ["datetime", datetimeModule["."]["datetime"]],
  ["Decimal", decimalModule["."]["Decimal"]],
]);

function getScalarIntrinsicExpression($: Typekit, type: Scalar | IntrinsicType): string | null {
  let intrinsicName: string;
  if ($.scalar.is(type)) {
    // This was always is overridden below?
    // if ($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
    //   const encoding = $.scalar.getEncoding(type);
    //   intrinsicName = "utcDateTime";
    //   switch (encoding?.encoding) {
    //     case "unixTimestamp":
    //     case "rfc7231":
    //     case "rfc3339":
    //     default:
    //       intrinsicName = `utcDateTime`;
    //       break;
    //   }
    // }
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

// TODO: When TypeSpec adds true generics support, add helper to detect generic type instances.
// Currently, TypeSpec templates expand to concrete types at compile time, so we treat all
// template instances as regular concrete types.

function isDeclaration($: Typekit, type: Type): boolean {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
    case "EnumMember":
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
