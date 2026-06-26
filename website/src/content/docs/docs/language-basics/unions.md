---
id: unions
title: Unions
description: "Language basics - unions"
llmstxt: true
---

Unions define a type that must be exactly one of several possible variants. There are two types of unions:

- Union expressions
- Named unions

## Union expressions

Unnamed unions, or union expressions, can be declared by combining the variants using the `|` operator.

```typespec
alias Breed = Beagle | GermanShepherd | GoldenRetriever;
```

In this example, `Breed` can be either a `Beagle`, a `GermanShepherd`, or a `GoldenRetriever`.

## Named unions

Named unions allow you to assign a name to the union and provide explicit variant references. Named unions are somewhat similar to [enums](./enums.md), but instead of having `string` or `numeric` values, they use [record models](./models.md).

A named union can be declared with the `union` keyword. Its name must be an [`identifier`](./identifiers.md).

```typespec
union Breed {
  beagle: Beagle,
  shepherd: GermanShepherd,
  retriever: GoldenRetriever,
}
```

The above example is equivalent to the `Breed` alias mentioned earlier, with the difference that emitters can recognize `Breed` as a named entity and also identify the `beagle`, `shepherd`, and `retriever` names for the options. This format also allows the application of [decorators](./decorators.md) to each of the options.

## Keyword unions in expression position

The `union` keyword can also be used anywhere a type expression is expected — for example as an alias value, a property type, a decorator or template argument, or a tuple element. Unlike a union expression built with the `|` operator, the keyword form can carry a name and named variants.

```typespec
model Pet {
  // anonymous keyword union in expression position
  breed: union {
    Beagle,
    GermanShepherd,
  };

  // named keyword union in expression position
  size: union Size {
    small: "S",
    medium: "M",
    large: "L",
  };
}
```

A keyword union used in expression position is marked as an expression and is **not** registered in the enclosing namespace, even when it is given a name. The name is kept on the resulting type for display purposes only — it cannot be referenced elsewhere.

Unlike the `|` operator, a keyword union used as an operand is **not** flattened into the surrounding union. For example, `union { "a", "b" } | "c"` produces a union of the nested `union { "a", "b" }` and `"c"`, preserving the named variants.

You can apply [decorators](./decorators.md) and doc comments to the declaration inline, and augment it through a navigation reference such as `::type`.
