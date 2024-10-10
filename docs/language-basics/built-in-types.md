---
id: built-in-types
title: Built-in types
---

TypeSpec Standard Library provide some built-in types that can be used to build more complex types.

Built in types are related to each other according to the rules described in [type relations](../language-basics/type-relations.md).

## Numeric types

| Type         | Range                                                                                                        | Description                               |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `numeric`    | [\*](#numeric-supertypes)                                                                                    | Parent type for all numeric types         |
| `integer`    | [\*](#numeric-supertypes)                                                                                    | A whole-number                            |
| `float`      | [\*](#numeric-supertypes)                                                                                    | A binary number                           |
| `int64`      | `-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`                                                  | A 64-bit integer                          |
| `int32`      | `-2,147,483,648` to `2,147,483,647`                                                                          | A 32-bit integer                          |
| `int16`      | `-32,768` to `32,767`                                                                                        | A 16-bit integer                          |
| `int8`       | `-128` to `127`                                                                                              | A 8-bit integer                           |
| `safeint`    | <code>−9007199254740991 (−(2<sup>53</sup> − 1))</code> to <code>9007199254740991 (2<sup>53</sup> − 1)</code> | An integer that can be serialized to JSON |
| `uint64`     | `0` to `18,446,744,073,709,551,615`                                                                          | Unsigned 64-bit integer                   |
| `uint32`     | `0` to `4,294,967,295`                                                                                       | Unsigned 32-bit integer                   |
| `uint16`     | `0` to `65,535`                                                                                              | Unsigned 16-bit integer                   |
| `uint8`      | `0` to `255 `                                                                                                | Unsigned 8-bit integer                    |
| `float32`    | <code> ±1.5 x 10<sup>45</sup></code> to <code>±3.4 x 10<sup>38</sup></code>                                  | A 32 bit floating point number            |
| `float64`    | <code>±5.0 × 10<sup>−324</sup></code> to <code>±1.7 × 10<sup>308</sup></code>                                | A 64 bit floating point number            |
| `decimal`    | [\*](#numeric-supertypes)                                                                                    | A decimal number                          |
| `decimal128` | 34 decimal digits with an exponent range from `-6143` to `6144`                                              | A 128 bit decimal number                  |

### Numeric supertypes

`numeric`, `integer`, `float` and `decimal` are types that represent any possible number in their category. For some emit targets, `BigInt` or `BigDecimal` might be an analogous type satisfying the TypeSpec types `integer` and `decimal` respectively. For other targets where the language, serialization format, or protocol does not support an analogous type, emitters may decide on a policy for emitting the numeric supertypes. This might involve picking the closest analogous type and reporting a warning when they are encountered.

## Date and time types

| Type             | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `plainDate`      | A date on a calendar without a time zone, e.g. "April 10th"                         |
| `plainTime`      | A time on a clock without a time zone, e.g. "3:00 am"                               |
| `utcDateTime`    | A date and time in coordinated universal time (UTC), e.g. "1985-04-12T23:20:50.52Z" |
| `offsetDateTime` | A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST"       |
| `duration`       | A duration/time period. e.g 5s, 10h                                                 |

## Other core types

| Type              | Description                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bytes`           | A sequence of bytes                                                                                                                                        |
| `string`          | A sequence of textual characters                                                                                                                           |
| `boolean`         | Boolean with `true` and `false` values                                                                                                                     |
| `null`            | Null value                                                                                                                                                 |
| `Array<Element>`  | Array model type, equivalent to `Element[]`                                                                                                                |
| `Record<Element>` | Model with string keys where all the values have type `Element` (similar to `Map<string, Element>` in TypeScript or `Dictionary<string, Element>` in .Net) |
| `unknown`         | A top type in TypeSpec that all types can be assigned to. Values that can have any type should be assigned this value (similar to `any` in JavaScript)     |
| `void`            | A function/operation return type indicating the function/operation doesn't return a value.                                                                 |
| `never`           | The never type indicates the values that will never occur.                                                                                                 |

## String types

Built-in types that are known string formats

| Type  | Description  |
| ----- | ------------ |
| `url` | A url String |
