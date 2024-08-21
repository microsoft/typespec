import { Numeric } from "../../core/numeric.js";
import type { BooleanLiteral, NumericLiteral, StringLiteral, Type } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

interface LiteralKit {
  literal: {
    /**
     * Create a literal type from a JavaScript value.
     *
     * @param value The JavaScript value to turn into a TypeSpec literal type.
     */
    create(value: string | number | boolean): StringLiteral | NumericLiteral | BooleanLiteral;

    /**
     * Create a string literal type from a JavaScript string value.
     *
     * @param value The string value.
     */
    createString(value: string): StringLiteral;

    /**
     * Create a numeric literal type from a JavaScript number value.
     *
     * @param value The numeric value.
     */
    createNumeric(value: number): NumericLiteral;

    /**
     * Create a boolean literal type from a JavaScript boolean value.
     *
     * @param value The boolean value.
     */
    createBoolean(value: boolean): BooleanLiteral;

    /**
     * Check if `type` is a literal type.
     *
     * @param type The type to check.
     */
    is(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral;

    /**
     * Check if `type` is a string literal type.
     *
     * @param type The type to check.
     */
    isString(type: Type): type is StringLiteral;

    /**
     * Check if `type` is a numeric literal type.
     *
     * @param type The type to check.
     */
    isNumeric(type: Type): type is NumericLiteral;

    /**
     * Check if `type` is a boolean literal type.
     *
     * @param type The type to check.
     */
    isBoolean(type: Type): type is BooleanLiteral;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends LiteralKit {}
}

defineKit<LiteralKit>({
  literal: {
    create(value) {
      if (typeof value === "string") {
        return this.literal.createString(value);
      } else if (typeof value === "number") {
        return this.literal.createNumeric(value);
      } else {
        return this.literal.createBoolean(value);
      }
    },
    createString(value) {
      return this.program.checker.createType({
        kind: "String",
        value,
      });
    },

    createNumeric(value) {
      const valueAsString = String(value);

      return this.program.checker.createType({
        kind: "Number",
        value,
        valueAsString,
        numericValue: Numeric(valueAsString),
      });
    },

    createBoolean(value) {
      return this.program.checker.createType({
        kind: "Boolean",
        value,
      });
    },

    isBoolean(type) {
      return type.kind === "Boolean";
    },
    isString(type) {
      return type.kind === "String";
    },
    isNumeric(type) {
      return type.kind === "Number";
    },
    is(type) {
      return (
        this.literal.isBoolean(type) || this.literal.isNumeric(type) || this.literal.isString(type)
      );
    },
  },
});
