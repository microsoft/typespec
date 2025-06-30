import type { BooleanLiteral, Entity, NumericLiteral, StringLiteral } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * A Typekit for working with literal types(string, numeric, boolean).
 *
 * @typekit literal
 */
export interface LiteralKit {
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
  is(type: Entity): type is StringLiteral | NumericLiteral | BooleanLiteral;

  /**
   * Check if `type` is a string literal type.
   *
   * @param type The type to check.
   */
  isString(type: Entity): type is StringLiteral;

  /**
   * Check if `type` is a numeric literal type.
   *
   * @param type The type to check.
   */
  isNumeric(type: Entity): type is NumericLiteral;

  /**
   * Check if `type` is a boolean literal type.
   *
   * @param type The type to check.
   */
  isBoolean(type: Entity): type is BooleanLiteral;
}

interface TypekitExtension {
  /**
   * Utilities for working with literal types.
   *
   * Literal types are types that represent a single value, such as a string,
   * number, or boolean.
   */
  literal: LiteralKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  literal: {
    create(value) {
      return this.program.checker.createLiteralType(value);
    },
    createString(value) {
      return this.program.checker.createLiteralType(value);
    },

    createNumeric(value) {
      return this.program.checker.createLiteralType(value);
    },

    createBoolean(value) {
      return this.program.checker.createLiteralType(value);
    },

    isBoolean(type) {
      return type.entityKind === "Type" && type.kind === "Boolean";
    },
    isString(type) {
      return type.entityKind === "Type" && type.kind === "String";
    },
    isNumeric(type) {
      return type.entityKind === "Type" && type.kind === "Number";
    },
    is(type) {
      return (
        this.literal.isBoolean(type) || this.literal.isNumeric(type) || this.literal.isString(type)
      );
    },
  },
});
