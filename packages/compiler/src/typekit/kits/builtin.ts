import type { Scalar } from "../../core/types.js";
import { defineKit } from "../define-kit.js";

/**
 * A kit of built-in types.
 * @typekit builtin
 */
export interface BuiltinKit {
  /**
   * Accessor for the string builtin type.
   */
  get string(): Scalar;

  /**
   * Accessor for the boolean builtin type.
   */
  get boolean(): Scalar;

  /**
   * Accessor for the bytes builtin type, representing binary data.
   */
  get bytes(): Scalar;

  /**
   * Accessor for the decimal builtin type for high-precision decimal values.
   */
  get decimal(): Scalar;

  /**
   * Accessor for the decimal128 builtin type, a 128-bit decimal value.
   */
  get decimal128(): Scalar;

  /**
   * Accessor for the duration builtin type, representing a span of time.
   */
  get duration(): Scalar;

  /**
   * Accessor for the float builtin type, representing a double-precision floating-point number.
   */
  get float(): Scalar;

  /**
   * Accessor for the float32 builtin type, representing a single-precision floating-point number.
   */
  get float32(): Scalar;

  /**
   * Accessor for the float64 builtin type, representing a double-precision floating-point number.
   */
  get float64(): Scalar;

  /**
   * Accessor for the int8 builtin type, representing an 8-bit signed integer.
   */
  get int8(): Scalar;

  /**
   * Accessor for the int16 builtin type, representing a 16-bit signed integer.
   */
  get int16(): Scalar;

  /**
   * Accessor for the int32 builtin type, representing a 32-bit signed integer.
   */
  get int32(): Scalar;

  /**
   * Accessor for the int64 builtin type, representing a 64-bit signed integer.
   */
  get int64(): Scalar;

  /**
   * Accessor for the integer builtin type, representing an arbitrary-precision integer.
   */
  get integer(): Scalar;

  /**
   * Accessor for the offsetDateTime builtin type, representing a date and time with an offset.
   */
  get offsetDateTime(): Scalar;

  /**
   * Accessor for the plainDate builtin type, representing a date without time or offset.
   */
  get plainDate(): Scalar;

  /**
   * Accessor for the plainTime builtin type, representing a time without date or offset.
   */
  get plainTime(): Scalar;

  /**
   * Accessor for the safeInt builtin type, representing an integer within the safe range for JavaScript.
   */
  get safeInt(): Scalar;

  /**
   * Accessor for the uint8 builtin type, representing an 8-bit unsigned integer.
   */
  get uint8(): Scalar;

  /**
   * Accessor for the uint16 builtin type, representing a 16-bit unsigned integer.
   */
  get uint16(): Scalar;

  /**
   * Accessor for the uint32 builtin type, representing a 32-bit unsigned integer.
   */
  get uint32(): Scalar;

  /**
   * Accessor for the uint64 builtin type, representing a 64-bit unsigned integer.
   */
  get uint64(): Scalar;

  /**
   * Accessor for the url builtin type, representing a valid URL string.
   */
  get url(): Scalar;

  /**
   * Accessor for the utcDateTime builtin type, representing a date and time in UTC.
   */
  get utcDateTime(): Scalar;

  /**
   * Accessor for the numeric builtin type, representing a numeric value.
   */
  get numeric(): Scalar;
}

interface TypekitExtension {
  builtin: BuiltinKit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  builtin: {
    get string(): Scalar {
      return this.program.checker.getStdType("string");
    },
    get boolean(): Scalar {
      return this.program.checker.getStdType("boolean");
    },
    get bytes(): Scalar {
      return this.program.checker.getStdType("bytes");
    },
    get decimal(): Scalar {
      return this.program.checker.getStdType("decimal");
    },
    get decimal128(): Scalar {
      return this.program.checker.getStdType("decimal128");
    },
    get duration(): Scalar {
      return this.program.checker.getStdType("duration");
    },
    get float(): Scalar {
      return this.program.checker.getStdType("float");
    },
    get float32(): Scalar {
      return this.program.checker.getStdType("float32");
    },
    get float64(): Scalar {
      return this.program.checker.getStdType("float64");
    },
    get int8(): Scalar {
      return this.program.checker.getStdType("int8");
    },
    get int16(): Scalar {
      return this.program.checker.getStdType("int16");
    },
    get int32(): Scalar {
      return this.program.checker.getStdType("int32");
    },
    get int64(): Scalar {
      return this.program.checker.getStdType("int64");
    },
    get integer(): Scalar {
      return this.program.checker.getStdType("integer");
    },
    get offsetDateTime(): Scalar {
      return this.program.checker.getStdType("offsetDateTime");
    },
    get plainDate(): Scalar {
      return this.program.checker.getStdType("plainDate");
    },
    get plainTime(): Scalar {
      return this.program.checker.getStdType("plainTime");
    },
    get safeInt(): Scalar {
      return this.program.checker.getStdType("safeint");
    },
    get uint8(): Scalar {
      return this.program.checker.getStdType("uint8");
    },
    get uint16(): Scalar {
      return this.program.checker.getStdType("uint16");
    },
    get uint32(): Scalar {
      return this.program.checker.getStdType("uint32");
    },
    get uint64(): Scalar {
      return this.program.checker.getStdType("uint64");
    },
    get url(): Scalar {
      return this.program.checker.getStdType("url");
    },
    get utcDateTime(): Scalar {
      return this.program.checker.getStdType("utcDateTime");
    },
    get numeric(): Scalar {
      return this.program.checker.getStdType("numeric");
    },
  },
});
