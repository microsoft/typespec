namespace TypeSpec;

/**
 * Represent a byte array
 */
scalar bytes;

/**
 * A numeric type
 */
scalar numeric;

/**
 * A whole number
 */
scalar integer extends numeric;

/**
 * A number with decimal value
 */
scalar float extends numeric;

/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
scalar int64 extends integer;

/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
scalar int32 extends int64;

/**
 * A 16-bit integer. (`-32,768` to `32,767`)
 */
scalar int16 extends int32;

/**
 * A 8-bit integer. (`-128` to `127`)
 */
scalar int8 extends int16;

/**
 * A 64-bit unsigned integer (`0` to `18,446,744,073,709,551,615`)
 */
scalar uint64 extends integer;

/**
 * A 32-bit unsigned integer (`0` to `4,294,967,295`)
 */
scalar uint32 extends uint64;

/**
 * A 16-bit unsigned integer (`0` to `65,535`)
 */
scalar uint16 extends uint32;

/**
 * A 8-bit unsigned integer (`0` to `255`)
 */
scalar uint8 extends uint16;

/**
 * An integer that can be serialized to JSON (`−9007199254740991 (−(2^53 − 1))` to `9007199254740991 (2^53 − 1)` )
 */
scalar safeint extends int64;

/**
 * A 32 bit floating point number. (`±1.5 x 10^−45` to `±3.4 x 10^38`)
 */
scalar float64 extends float;

/**
 * A 32 bit floating point number. (`±5.0 × 10^−324` to `±1.7 × 10^308`)
 */
scalar float32 extends float64;

/**
 * A decimal number with any length and precision.
 */
scalar decimal extends numeric;

/**
 * A 128-bit decimal number.
 */
scalar decimal128 extends decimal;

/**
 * A sequence of textual characters.
 */
scalar string;

/**
 * A date on a calendar without a time zone, e.g. "April 10th"
 */
scalar plainDate;

/**
 * A time on a clock without a time zone, e.g. "3:00 am"
 */
scalar plainTime;

/**
 * An instant in coordinated universal time (UTC)"
 */
scalar utcDateTime;

/**
 * A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST"
 */
scalar offsetDateTime;

/**
 * A duration/time period. e.g 5s, 10h
 */
scalar duration;

/**
 * Boolean with `true` and `false` values.
 */
scalar boolean;

/**
 * Represent a model
 */
// Deprecated June 2023 sprint
#deprecated "object is deprecated. Please use {} for an empty model, `Record<unknown>` for a record with unknown property types, `unknown[]` for an array."
model object {}

/**
 * @dev Array model type, equivalent to `T[]`
 * @template T The type of the array elements
 */
@indexer(integer, T)
model Array<T> {}

/**
 * @dev Model with string properties where all the properties have type `T`
 * @template T The type of the properties
 */
@indexer(string, T)
model Record<T> {}

/**
 * Represent a URL string as described by https://url.spec.whatwg.org/
 */
scalar url extends string;

/**
 * Represents a collection of optional properties.
 * @template T An object whose spread properties are all optional.
 */
@doc("The template for adding optional properties.")
@withOptionalProperties
model OptionalProperties<T> {
  ...T;
}

/**
 * Represents a collection of updateable properties.
 * @template T An object whose spread properties are all updateable.
 */
@doc("The template for adding updateable properties.")
@withUpdateableProperties
model UpdateableProperties<T> {
  ...T;
}

/**
 * Represents a collection of omitted properties.
 * @template T An object whose properties are spread.
 * @template TKeys The property keys to omit.
 */
@doc("The template for omitting properties.")
@withoutOmittedProperties(TKeys)
model OmitProperties<T, TKeys extends string> {
  ...T;
}

/**
 * Represents a collection of properties with default values omitted.
 * @template T An object whose spread property defaults are all omitted.
 */
@withoutDefaultValues
model OmitDefaults<T> {
  ...T;
}

/**
 * Applies a visiblity setting to a collection of properties.
 * @template T An object whose properties are spread.
 * @template Visibility The visibility to apply to all properties.
 */
@doc("The template for setting the default visibility of key properties.")
@withDefaultKeyVisibility(Visibility)
model DefaultKeyVisibility<T, Visibility extends valueof string> {
  ...T;
}
