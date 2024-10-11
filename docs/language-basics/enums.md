---
id: enums
title: Enums
---

Enums, short for enumerations, provide a way for developers to define a collection of named constants. They are useful for documenting the purpose of the code or for establishing a set of distinct scenarios. Enums can be either numeric or string-based. For other data types, consider using [unions](./unions.md).

## The basics

You can declare enums using the `enum` keyword. The members of an enum are separated by commas `,` and can be either [`identifier`](./identifiers.md) TypeSpecs or `string literal`s.

```typespec
enum Direction {
  North,
  East,
  South,
  West,
}
```

In the above example, we haven't defined the representation of the constants. Depending on the context, enums might be handled differently.

## Assigning values to enums

You can assign custom values to enum members using the `:` operator.

```typespec
enum Direction {
  North: "north",
  East: "east",
  South: "south",
  West: "west",
}
```

These values can also be integers.

```typespec
enum Foo {
  One: 1,
  Ten: 10,
  Hundred: 100,
  Thousand: 1000,
}
```

Or even floating-point numbers.

```typespec
enum Hour {
  Zero: 0,
  Quarter: 0.25,
  Half: 0.5,
  ThreeQuarter: 0.75,
}
```

## Combining enums

You can combine enums using the spread `...` pattern. This copies all the members from the source enum to the target enum, but it doesn't establish any reference between the source and target enums.

```typespec
enum DirectionExt {
  ...Direction,
  `North East`,
  `North West`,
  `South East`,
  `South West`,
}
```

## How to reference enum members

You can reference enum members using the `.` operator for identifiers.

```typespec
alias North = Direction.North;
```
