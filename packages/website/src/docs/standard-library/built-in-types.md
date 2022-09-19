---
id: built-in-types
title: Built-in types
---

# Built-in Types

Cadl Standard Library provide some built-in types that can be used to build more complex types.

See [type relations]({%doc "type-relations"%}) for details on how those types are structred.

## Numeric types

| Type      | Range                                                              | Description                               |
| --------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `numeric` |                                                                    | Parent type for all numeric types         |
| `integer` |                                                                    | A whole-number                            |
| `float`   |                                                                    | A number with decimal value               |
| `int64`   | `-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`        | A 64-bit integer                          |
| `int32`   | `-2,147,483,648` to `2,147,483,647`                                | A 32-bit integer                          |
| `int16`   | `-32,768` to `32,767`                                              | A 16-bit integer                          |
| `int8`    | `-128` to `127`                                                    | A 8-bit integer                           |
| `safeint` | `−9007199254740991 (−(2^53 − 1))` to `9007199254740991 (2^53 − 1)` | An integer that can be serialized to JSON |
| `uint64`  | `0` to `18,446,744,073,709,551,615`                                | Unsigned 64-bit integer                   |
| `uint32`  | `0` to `4,294,967,295`                                             | Unsigned 32-bit integer                   |
| `uint16`  | `0` to `65,535`                                                    | Unsigned 16-bit integer                   |
| `uint8`   | `0` to `255 `                                                      | Unsigned 8-bit integer                    |
| `float32` | `±1.5 x 10−45` to `±3.4 x 1038`                                    | A 32 bit floating point number            |
| `float64` | `±5.0 × 10−324` to `±1.7 × 10308`                                  | A 64 bit floating point number            |

## Date and time types

| Type            | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `plainDate`     | A date on a calendar without a time zone, e.g. "April 10th"                   |
| `plainTime`     | A time on a clock without a time zone, e.g. "3:00 am"                         |
| `zonedDateTime` | A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST" |
| `duration`      | A duration/time period. e.g 5s, 10h                                           |

## Others

| Type        | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `bytes`     | A date on a calendar without a time zone, e.g. "April 10th"                                |
| `string`    | A time on a clock without a time zone, e.g. "3:00 am"                                      |
| `boolean`   | A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST"              |
| `null`      | Null value                                                                                 |
| `object`    | Represent any structured model.(With properties)                                           |
| `Array<T>`  | Array model type, equivalent to `T[]`                                                      |
| `Record<T>` | Model with string properties where all the properties have type `T`                        |
| `unknown`   | A top type in Cadl that all types can be assigned to.                                      |
| `void`      | A function/operation return type indicating the function/operation doesn't return a value. |
| `never`     | The never type indicates the values that will never occur.                                 |
