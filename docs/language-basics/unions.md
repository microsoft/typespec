---
id: unions
title: Unions
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
