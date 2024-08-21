import { isIntrinsicType } from "../../core/decorator-utils.js";
import type { IntrinsicScalarName, Scalar, Type } from "../../core/types.js";
import { type EncodeData, getEncode } from "../../lib/decorators.js";
import { defineKit, type TypekitPrototype } from "../define-kit.js";

interface ScalarKit {
  /**
   * Operations for scalar types like strings, numerics, booleans, dates, etc.
   */
  scalar: {
    /**
     * Check if `type` is any scalar type.
     *
     * @param type The type to check.
     */
    is(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard boolean type.
     *
     * @param type The type to check.
     */
    isBoolean(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard bytes type.
     *
     * @param type The type to check.
     */
    isBytes(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard decimal type.
     *
     * @param type The type to check.
     */
    isDecimal(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard decimal128 type.
     *
     * @param type The type to check.
     */
    isDecimal128(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard duration type.
     *
     * @param type The type to check.
     */
    isDuration(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard float type.
     *
     * @param type The type to check.
     */
    isFloat(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard float32 type.
     *
     * @param type The type to check.
     */
    isFloat32(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard float64 type.
     *
     * @param type The type to check.
     */
    isFloat64(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard int8 type.
     *
     * @param type The type to check.
     */
    isInt8(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard int16 type.
     *
     * @param type The type to check.
     */
    isInt16(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard int32 type.
     *
     * @param type The type to check.
     */
    isInt32(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard int64 type.
     *
     * @param type The type to check.
     */
    isInt64(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard integer type.
     *
     * @param type The type to check.
     */
    isInteger(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard offsetDateTime type.
     *
     * @param type The type to check.
     */
    isOffsetDateTime(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard plainDate type.
     *
     * @param type The type to check.
     */
    isPlainDate(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard plainTime type.
     *
     * @param type The type to check.
     */
    isPlainTime(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard safeint type.
     *
     * @param type The type to check.
     */
    isSafeint(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard uint8 type.
     *
     * @param type The type to check.
     */
    isUint8(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard uint16 type.
     *
     * @param type The type to check.
     */
    isUint16(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard uint32 type.
     *
     * @param type The type to check.
     */
    isUint32(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard uint64 type.
     *
     * @param type The type to check.
     */
    isUint64(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard url type.
     *
     * @param type The type to check.
     */
    isUrl(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard utcDateTime type.
     *
     * @param type The type to check.
     */
    isUtcDateTime(type: Type): type is Scalar;

    /**
     *
     * @param type The type to check.
     */
    isNumeric(type: Type): type is Scalar;

    /**
     * Check if `type` is exactly the standard string type.
     *
     * @param type The type to check.
     */
    isString(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard boolean type.
     *
     * @param type The type to check.
     */
    extendsBoolean(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard string type.
     *
     * @param type The type to check.
     */
    extendsString(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard numeric type.
     *
     * @param type The type to check.
     */
    extendsNumeric(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard bytes type.
     *
     * @param type The type to check.
     */
    extendsBytes(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard decimal type.
     *
     * @param type The type to check.
     */
    extendsDecimal(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard decimal128 type.
     *
     * @param type The type to check.
     */
    extendsDecimal128(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard duration type.
     *
     * @param type The type to check.
     */
    extendsDuration(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard float type.
     *
     * @param type The type to check.
     */
    extendsFloat(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard float32 type.
     *
     * @param type The type to check.
     */
    extendsFloat32(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard float64 type.
     *
     * @param type The type to check.
     */
    extendsFloat64(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard int8 type.
     *
     * @param type The type to check.
     */
    extendsInt8(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard int16 type.
     *
     * @param type The type to check.
     */
    extendsInt16(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard int32 type.
     *
     * @param type The type to check.
     */
    extendsInt32(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard int64 type.
     *
     * @param type The type to check.
     */
    extendsInt64(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard integer type.
     *
     * @param type The type to check.
     */
    extendsInteger(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard offsetDateTime type.
     *
     * @param type The type to check.
     */
    extendsOffsetDateTime(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard plainDate type.
     *
     * @param type The type to check.
     */
    extendsPlainDate(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard plainTime type.
     *
     * @param type The type to check.
     */
    extendsPlainTime(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard safeint type.
     *
     * @param type The type to check.
     */
    extendsSafeint(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard uint8 type.
     *
     * @param type The type to check.
     */
    extendsUint8(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard uint16 type.
     *
     * @param type The type to check.
     */
    extendsUint16(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard uint32 type.
     *
     * @param type The type to check.
     */
    extendsUint32(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard uint64 type.
     *
     * @param type The type to check.
     */
    extendsUint64(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard url type.
     *
     * @param type The type to check.
     */
    extendsUrl(type: Type): type is Scalar;

    /**
     * Check if `type` extends the standard utcDateTime type.
     *
     * @param type The type to check.
     */
    extendsUtcDateTime(type: Type): type is Scalar;

    /**
     * Get the standard built-in base type of a scalar. For all built-in scalar
     * types (numeric, string, int32, etc.) this will just return the scalar
     * type. For user-defined scalars, this will return the first base scalar
     * that is built-in. For user-defined scalars without a standard base type,
     * this will return null.
     *
     * @param type The scalar to check.
     */
    getStdBase(type: Scalar): Scalar | null;

    /**
     * Get the encoding information for a scalar type. Returns undefined if no
     * encoding data is specified.
     *
     * @param scalar The scalar to get the encoding data for.
     */
    getEncoding(scalar: Scalar): EncodeData | undefined;
  };
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends ScalarKit {}
}

defineKit<ScalarKit>({
  scalar: {
    is(type) {
      return type.kind === "Scalar";
    },
    extendsBoolean: extendsStdType("boolean"),
    extendsBytes: extendsStdType("bytes"),
    extendsDecimal: extendsStdType("decimal"),
    extendsDecimal128: extendsStdType("decimal128"),
    extendsDuration: extendsStdType("duration"),
    extendsFloat: extendsStdType("float"),
    extendsFloat32: extendsStdType("float32"),
    extendsFloat64: extendsStdType("float64"),
    extendsInt8: extendsStdType("int8"),
    extendsInt16: extendsStdType("int16"),
    extendsInt32: extendsStdType("int32"),
    extendsInt64: extendsStdType("int64"),
    extendsInteger: extendsStdType("integer"),
    extendsNumeric: extendsStdType("numeric"),
    extendsOffsetDateTime: extendsStdType("offsetDateTime"),
    extendsPlainDate: extendsStdType("plainDate"),
    extendsPlainTime: extendsStdType("plainTime"),
    extendsSafeint: extendsStdType("safeint"),
    extendsString: extendsStdType("string"),
    extendsUint8: extendsStdType("uint8"),
    extendsUint16: extendsStdType("uint16"),
    extendsUint32: extendsStdType("uint32"),
    extendsUint64: extendsStdType("uint64"),
    extendsUrl: extendsStdType("url"),
    extendsUtcDateTime: extendsStdType("utcDateTime"),

    isBoolean: isStdType("boolean"),
    isBytes: isStdType("bytes"),
    isDecimal: isStdType("decimal"),
    isDecimal128: isStdType("decimal128"),
    isDuration: isStdType("duration"),
    isFloat: isStdType("float"),
    isFloat32: isStdType("float32"),
    isFloat64: isStdType("float64"),
    isInt8: isStdType("int8"),
    isInt16: isStdType("int16"),
    isInt32: isStdType("int32"),
    isInt64: isStdType("int64"),
    isInteger: isStdType("integer"),
    isNumeric: isStdType("numeric"),
    isOffsetDateTime: isStdType("offsetDateTime"),
    isPlainDate: isStdType("plainDate"),
    isPlainTime: isStdType("plainTime"),
    isSafeint: isStdType("safeint"),
    isString: isStdType("string"),
    isUint8: isStdType("uint8"),
    isUint16: isStdType("uint16"),
    isUint32: isStdType("uint32"),
    isUint64: isStdType("uint64"),
    isUrl: isStdType("url"),
    isUtcDateTime: isStdType("utcDateTime"),

    getStdBase(type) {
      const tspNamespace = this.program.resolveTypeReference("TypeSpec")[0]!;
      let current: Type | undefined = type;
      while (current) {
        if (current.namespace === tspNamespace) {
          return current;
        }

        current = current.baseScalar;
      }

      return null;
    },

    getEncoding(type) {
      return getEncode(this.program, type);
    },
  },
});

function isStdType(typeName: IntrinsicScalarName) {
  return function (this: TypekitPrototype, type: Type) {
    return type === this.program.checker.getStdType(typeName);
  };
}

function extendsStdType(typeName: IntrinsicScalarName) {
  return function (this: TypekitPrototype, type: Type) {
    if (!this.scalar.is(type)) {
      return false;
    }

    return isIntrinsicType(this.program, type, typeName);
  };
}
