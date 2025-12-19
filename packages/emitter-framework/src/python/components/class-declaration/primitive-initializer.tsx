import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Type, Value } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { Atom } from "../atom/atom.js";

export interface PrimitiveInitializerProps {
  /**
   * The default value to convert to a Python initializer expression.
   */
  defaultValue: Value;
  /**
   * The property type, used to determine float vs int formatting.
   */
  propertyType: Type;
}

/**
 * Renders a Python primitive initializer from a TypeSpec default value.
 *
 * Handles StringValue, BooleanValue, NullValue, NumericValue, and ArrayValue.
 * For numeric values, uses the propertyType to determine whether to render as float.
 *
 * @returns The Python initializer expression, or undefined if not supported.
 */
export function PrimitiveInitializer(props: PrimitiveInitializerProps): Children | undefined {
  const { $ } = useTsp();
  const { defaultValue, propertyType } = props;

  if (!defaultValue) return undefined;

  const valueKind = (defaultValue as any).valueKind ?? (defaultValue as any).kind;
  switch (valueKind) {
    case "StringValue":
    case "BooleanValue":
    case "NullValue":
      return <py.Atom jsValue={(defaultValue as any).value} />;
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
        return <Atom value={defaultValue} float />;
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
