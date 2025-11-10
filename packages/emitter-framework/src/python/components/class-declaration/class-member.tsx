import { typingModule } from "#python/builtins.js";
import { type Children, code, mapJoin } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { type ModelProperty, type Operation } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { efRefkey } from "../../utils/refkey.js";
import { areAllLiterals } from "../../utils/type.js";
import { Atom } from "../atom/atom.jsx";
import { TypeExpression } from "../type-expression/type-expression.jsx";
import { Method } from "./class-method.jsx";

export interface ClassMemberProps {
  type: ModelProperty | Operation;
  doc?: Children;
  optional?: boolean;
  methodType?: "method" | "class" | "static";
  abstract?: boolean;
}

/**
 * Builds the primitive initializer from the default value.
 * @param defaultValue - The default value.
 * @returns The primitive initializer.
 */
function buildPrimitiveInitializerFromDefault(
  defaultValue: any,
  propertyType: any,
  $: ReturnType<typeof useTsp>["$"],
): Children | undefined {
  if (!defaultValue) return undefined;
  const valueKind = (defaultValue as any).valueKind ?? (defaultValue as any).kind;
  switch (valueKind) {
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return <py.Atom jsValue={defaultValue.value} />;
    case "NumericValue": {
      // The Atom component converts NumericValue via asNumber(), which normalizes 100.0 to 100.
      // Atom also has no access to the field type (float vs int), so it can't decide when to keep a trailing .0.
      // Here we do have the propertyType so, for float/decimal fields, we render a raw value and append ".0"
      // when needed. For non-float fields, default to a plain numeric Atom.

      // Unwrap potential numeric wrapper shape and preserve float formatting
      let raw: any = (defaultValue as any).value;
      // Example: value is { value: "100", isInteger: true }
      if (raw && typeof raw === "object" && "value" in raw) raw = raw.value;

      // Float-like property types (including custom subtypes) should render with float hint
      if ($.scalar.extendsFloat(propertyType) || $.scalar.extendsDecimal(propertyType)) {
        return <Atom value={defaultValue} assumeFloat />;
      }

      // Otherwise output as a number atom
      return <py.Atom jsValue={Number(raw)} />;
    }
    case "ArrayValue":
      return <Atom value={defaultValue} />;
    default:
      return undefined;
  }
}

/**
 * Builds the type node for the property. This handles various literal and union variant scenarios:
 * - Single union variant reference: Color.blue produces Literal[Color.BLUE]
 * - Union of string literals: "a" | "b" produces Literal["a", "b"]
 * - Union of integer literals: 1 | 2 | 3 produces Literal[1, 2, 3]
 * - Union of boolean literals: true | false produces Literal[True, False]
 * - Union of variant references: Color.red | Color.blue produces Literal[Color.RED, Color.BLUE]
 * - Mixed literal unions: "a" | 1 | true | Color.RED produces Literal["a", 1, True, Color.RED]
 *
 * @param unpackedType - The unpacked type.
 * @returns The type node, or undefined if the type doesn't match any supported literal pattern.
 */
function buildTypeNodeForProperty(unpackedType: any): Children | undefined {
  const { $ } = useTsp();

  // Single union variant reference - Literal[Color.MEMBER]
  if (unpackedType && unpackedType.kind === "UnionVariant" && unpackedType.union) {
    const unionType = unpackedType.union;
    const variantValue = unpackedType.type;
    const enumMemberName =
      variantValue && typeof variantValue.value === "string"
        ? variantValue.value
        : String(variantValue?.value ?? "");
    return (
      <>
        {typingModule["."]["Literal"]}[{efRefkey(unionType)}.{enumMemberName}]
      </>
    );
  }

  // Union of literals or variant references (including mixed)
  if (
    unpackedType &&
    unpackedType.kind === "Union" &&
    Array.isArray((unpackedType as any).options)
  ) {
    const opts: any[] = (unpackedType as any).options;

    // Check if all options are valid literal types
    if (areAllLiterals($, opts)) {
      const literalValues = opts
        .map((opt) => {
          if ($.literal.isString(opt)) {
            // String literals need quotes
            return JSON.stringify(opt.value);
          } else if ($.literal.isNumeric(opt)) {
            // Number literals render directly
            return String(opt.value);
          } else if ($.literal.isBoolean(opt)) {
            // Boolean literals render as True/False (Python capitalization)
            return opt.value ? "True" : "False";
          } else if (opt.kind === "UnionVariant") {
            // Variant references need enum reference
            const variantValue = opt.type;
            const enumMemberName =
              variantValue && typeof variantValue.value === "string"
                ? variantValue.value
                : String(variantValue?.value ?? "");
            return code`${efRefkey(opt.union)}.${enumMemberName}`;
          }
          return undefined;
        })
        .filter(Boolean);

      return (
        <>
          {typingModule["."]["Literal"]}[
          {mapJoin(
            () => literalValues,
            (val) => val,
            { joiner: ", " },
          )}
          ]
        </>
      );
    }
  }

  return undefined;
}

/**
 * Creates the class member for the property.
 * @param props - The props for the class member.
 * @returns The class member.
 */
export function ClassMember(props: ClassMemberProps) {
  const { $ } = useTsp();
  const namer = py.usePythonNamePolicy();
  const name = namer.getName(props.type.name, "class-member");
  const doc = props.doc ?? $.type.getDoc(props.type);

  if ($.modelProperty.is(props.type)) {
    // Map never-typed properties to typing.Never

    const unpackedType = props.type.type;
    const isOptional = props.optional ?? props.type.optional ?? false;
    const defaultValue = props.type.defaultValue;
    const literalTypeNode = buildTypeNodeForProperty(unpackedType);
    const initializer = buildPrimitiveInitializerFromDefault(defaultValue, unpackedType, $);
    const unpackedTypeNode: Children = literalTypeNode ?? <TypeExpression type={unpackedType} />;
    const typeNode = isOptional ? (
      <py.TypeReference
        refkey={typingModule["."].Optional}
        typeArgs={[unpackedTypeNode]}
      ></py.TypeReference>
    ) : (
      unpackedTypeNode
    );

    const classMemberProps = {
      doc,
      name,
      optional: isOptional,
      type: typeNode,
      ...(initializer ? { initializer } : {}),
      omitNone: !isOptional,
    };
    return <py.VariableDeclaration {...classMemberProps} />;
  }

  if ($.operation.is(props.type)) {
    return (
      <Method type={props.type} doc={doc} methodType={props.methodType} abstract={props.abstract} />
    );
  }
}
