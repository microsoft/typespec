import { Numeric } from "../../core/numeric.js";
import { isValue } from "../../core/type-utils.js";
import type {
  ArrayValue,
  BooleanValue,
  Entity,
  EnumValue,
  Node,
  NullValue,
  NumericValue,
  ObjectValue,
  ScalarValue,
  StringValue,
  Type,
  Value,
} from "../../core/types.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";

/**
 * @typekit value
 */
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
  createNumeric(value: number | Numeric): NumericValue;

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
  isString(type: Entity): type is StringValue;

  /**
   * Check if `type` is a numeric Value type.
   *
   * @param type The type to check.
   */
  isNumeric(type: Entity): type is NumericValue;

  /**
   * Check if `type` is a scalar value type
   * @param type The type to check.
   */
  isScalar(type: Entity): type is ScalarValue;

  /**
   * Check if `type` is an object value type
   * @param type The type to check.
   */
  isObject(type: Entity): type is ObjectValue;

  /**
   * Check if `type` is an array value type
   * @param type The type to check.
   */
  isArray(type: Entity): type is ArrayValue;

  /**
   * Check if `type` is an enum value type
   * @param type The type to check.
   */
  isEnum(type: Entity): type is EnumValue;

  /**
   * Check if `type` is a null value Type.
   * @param type The type to check.
   */
  isNull(type: Entity): type is NullValue;

  /**
   * Check if `type` is a boolean Value type.
   *
   * @param type The type to check.
   */
  isBoolean(type: Entity): type is BooleanValue;

  /**
   * Check if `type` is a Value type.
   * @param type The type to check.
   */
  is(type: Entity): type is Value;

  /**
   * Check if the source type can be assigned to the target.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic
   */
  isAssignableTo: Diagnosable<
    (source: Value, target: Entity, diagnosticTarget?: Entity | Node) => boolean
  >;

  /**
   * Check if the source type can be assigned to the target type.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic
   */
  isOfType: Diagnosable<(source: Value, target: Type, diagnosticTarget?: Entity | Node) => boolean>;

  /**
   * Resolve a value reference to a TypeSpec value.
   * By default any diagnostics are ignored.
   *
   * If a `kind` is provided, it will check if the resolved value matches the expected kind
   * and throw an error if it doesn't.
   *
   * Call `value.resolve.withDiagnostics("reference")` to get a tuple containing the resolved value and any diagnostics.
   */
  resolve: Diagnosable<
    <K extends Value["valueKind"] | undefined>(
      reference: string,
      kind?: K,
    ) => K extends Value["valueKind"] ? Extract<Value, { valueKind: K }> : undefined
  >;
}

interface TypekitExtension {
  value: ValueKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  value: {
    is(value) {
      return value.entityKind === "Value";
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
      return this.value.is(type) && type.valueKind === "BooleanValue";
    },
    isString(type) {
      return this.value.is(type) && type.valueKind === "StringValue";
    },
    isNumeric(type) {
      return this.value.is(type) && type.valueKind === "NumericValue";
    },
    isArray(type) {
      return this.value.is(type) && type.valueKind === "ArrayValue";
    },
    isObject(type) {
      return this.value.is(type) && type.valueKind === "ObjectValue";
    },
    isEnum(type) {
      return this.value.is(type) && type.valueKind === "EnumValue";
    },
    isNull(type) {
      return this.value.is(type) && type.valueKind === "NullValue";
    },
    isScalar(type) {
      return this.value.is(type) && type.valueKind === "ScalarValue";
    },
    isAssignableTo: createDiagnosable(function (source, target, diagnosticTarget) {
      return this.program.checker.isTypeAssignableTo(source, target, diagnosticTarget ?? source);
    }),
    isOfType: createDiagnosable(function (source, target, diagnosticTarget) {
      return this.program.checker.isValueOfType(source, target, diagnosticTarget ?? source);
    }),
    resolve: createDiagnosable(function (reference, kind) {
      const [value, diagnostics] = this.program.resolveTypeOrValueReference(reference);
      if (value && !isValue(value)) {
        return [undefined, diagnostics];
      }
      if (value && kind && value.valueKind !== kind) {
        throw new Error(`Value kind mismatch: expected ${kind}, got ${value.valueKind}`);
      }
      return [value, diagnostics];
    }),
  },
});
