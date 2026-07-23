---
id: enums
title: Enums
description: "Language basics - enums"
llmstxt: true
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

## In expression position

:::warning
Declaration expressions are an experimental TypeSpec feature. Using a `model`, `enum`, `union`, or `scalar` declaration in expression position yields an `experimental-feature` warning. Enable them without the warning by adding `declaration-expressions` to the `features` list in your `tspconfig.yaml`:

```yaml
kind: project
features:
  - declaration-expressions
```

:::

The `enum` keyword can also be used anywhere a type expression is expected — for example as an alias value, a property type, a decorator or template argument, or a tuple element.

```typespec
model Task {
  // anonymous enum in expression position
  status: enum {
    active,
    inactive,
  };

  // named enum in expression position
  priority: enum Priority {
    low,
    medium,
    high,
  };
}
```

An enum used in expression position is marked as an expression and is **not** registered in the enclosing namespace, even when it is given a name. The name is kept on the resulting type for display purposes only — it cannot be referenced elsewhere.

You can apply [decorators](./decorators.md) and doc comments to the declaration inline, and augment it through a navigation reference such as `::type`:

```typespec
model Task {
  status: @doc("The current status") enum {
    active,
    inactive,
  };
}

@@doc(Task.status::type, "The current status");
```
