---
id: enums
title: Enums
---

# Enums

Enums allow a developer to define a set of named constants. Using enums can make it easier to document intent, or create a set of distinct cases. Enums can either be numeric or string-based. For other types, look into [union](./unions.md)

## Basics

Enums are declared using the `enum` keyword.
The enums members are comma `,` separated and can be typespec `identifier`s or `string literal`s.

```typespec
enum Direction {
  North,
  East,
  South,
  West,
}
```

In this case, we haven't specified how the constants will be represented. Different scenarios might handle the enums differently.

## Values

Enums members can have a custom value that can be assigned using the `:` operator.

```typespec
enum Direction {
  North: "north",
  East: "east",
  South: "south",
  West: "west",
}
```

Values can also be integers.

```typespec
enum Foo {
  One: 1,
  Ten: 10,
  Hundred: 100,
  Thousand: 1000,
}
```

or float

```typespec
enum Hour {
  Zero: 0,
  Quarter: 0.25,
  Half: 0.5,
  ThreeQuarter: 0.75,
}
```

## Composing enums

Enums can be reused using the spread `...` pattern. All the members of the source enums will be copied in the target enum but it doesn't create any reference between the source and target enums.

```typespec
enum DirectionExt {
  ...Direction,
  `North East`,
  `North West`,
  `South East`,
  `South West`,
}
```

## Referencing enum members

Enum members can be referenced using the `.` operator for identifiers.

```typespec
alias North = Direction.North;
```
