import { Numeric } from "../../../core/numeric.js";
import type {
  ArrayValue,
  BooleanValue,
  EnumValue,
  NullValue,
  NumericValue,
  ObjectValue,
  ScalarValue,
  StringValue,
  Value,
} from "../../../core/types.js";
import { defineKit } from "../define-kit.js";

/** @experimental */
export interface ValueKit {
  /**
   * Create a Value type from a JavaScript value.
   *
   * @param value The JavaScript value to turn into a TypeSpec Value type.
   */
  create(value: string | number | boolean): Value;

  /**
   * Create a string Value type from a JavaScript string value.
   *
   * @param value The string value.
   */
  createString(value: string): StringValue;

  /**
   * Create a numeric Value type from a JavaScript number value.
   *
   * @param value The numeric value.
   */
  createNumeric(value: number): NumericValue;

  /**
   * Create a boolean Value type from a JavaScript boolean value.
   *
   * @param value The boolean value.
   */
  createBoolean(value: boolean): BooleanValue;

  /**
   * Check if `type` is a string Value type.
   *
   * @param type The type to check.
   */
  isString(type: Value): type is StringValue;

  /**
   * Check if `type` is a numeric Value type.
   *
   * @param type The type to check.
   */
  isNumeric(type: Value): type is NumericValue;

  /**
   * Check if `type` is a scalar value type
   * @param type The type to check.
   */
  isScalar(type: Value): type is ScalarValue;

  /**
   * Check if `type` is an object value type
   * @param type The type to check.
   */
  isObject(type: Value): type is ObjectValue;

  /**
   * Check if `type` is an array value type
   * @param type The type to check.
   */
  isArray(type: Value): type is ArrayValue;

  /**
   * Check if `type` is an enum value type
   * @param type The type to check.
   */
  isEnum(type: Value): type is EnumValue;

  /**
   * Check if `type` is a null value Type.
   * @param type The type to check.
   */
  isNull(type: Value): type is NullValue;

  /**
   * Check if `type` is a boolean Value type.
   *
   * @param type The type to check.
   */
  isBoolean(type: Value): type is BooleanValue;

  is(type: { valueKind: string }): type is Value;
}

interface TypekitExtension {
  /** @experimental */
  value: ValueKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  value: {
    is(value) {
      const type = value as any;
      return (
        this.value.isString(type) ||
        this.value.isNumeric(type) ||
        this.value.isBoolean(type) ||
        this.value.isArray(type) ||
        this.value.isObject(type) ||
        this.value.isEnum(type) ||
        this.value.isNull(type) ||
        this.value.isScalar(type)
      );
    },
    create(value) {
      if (typeof value === "string") {
        return this.value.createString(value);
      } else if (typeof value === "number") {
        return this.value.createNumeric(value);
      } else {
        return this.value.createBoolean(value);
      }
    },
    createString(value) {
      return {
        entityKind: "Value",
        value: value,
        valueKind: "StringValue",
        type: this.literal.createString(value),
        scalar: undefined,
      } as StringValue;
    },

    createNumeric(value) {
      const valueAsString = String(value);

      return {
        entityKind: "Value",
        value: Numeric(valueAsString),
        valueKind: "NumericValue",
        type: this.literal.createNumeric(value),
        scalar: undefined,
      } as NumericValue;
    },

    createBoolean(value) {
      return {
        entityKind: "Value",
        value: value,
        valueKind: "BooleanValue",
        type: this.literal.createBoolean(value),
        scalar: undefined,
      } as BooleanValue;
    },

    isBoolean(type) {
      return type.valueKind === "BooleanValue";
    },
    isString(type) {
      return type.valueKind === "StringValue";
    },
    isNumeric(type) {
      return type.valueKind === "NumericValue";
    },
    isArray(type) {
      return type.valueKind === "ArrayValue";
    },
    isObject(type) {
      return type.valueKind === "ObjectValue";
    },
    isEnum(type) {
      return type.valueKind === "EnumValue";
    },
    isNull(type) {
      return type.valueKind === "NullValue";
    },
    isScalar(type) {
      return type.valueKind === "ScalarValue";
    },
  },
});
