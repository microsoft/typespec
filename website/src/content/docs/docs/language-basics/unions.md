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

## Constraining a union with `extends`

A named union can declare a base type with the `extends` keyword. Every variant of the union must be [assignable](./type-relations.md) to that base type, otherwise a diagnostic is reported on the offending variant.

```typespec
model Dog {
  name: string;
}
model Beagle extends Dog {
  huntingSkill: string;
}
model GermanShepherd extends Dog {
  guardingSkill: string;
}

union Breed extends Dog {
  beagle: Beagle,
  shepherd: GermanShepherd,
}
```

This serves two purposes:

- It prevents a common class of mistake where an unrelated type is accidentally added to a union.
- It records the common base type in the type graph, which makes it easy for emitters to represent the union with a polymorphic base type in languages that don't support unions natively.

The base type does **not** become a variant of the union. `Breed` above still has exactly two variants.

`extends` is a constraint, not a declaration of inheritance. A variant only needs to be assignable to the base type, it doesn't have to explicitly `extends` it:

```typespec
model Dog {
  name: string;
}
model Beagle {
  name: string;
  huntingSkill: string;
}

// Ok: `Beagle` is assignable to `Dog` even though it doesn't explicitly extend it.
union Breed extends Dog {
  beagle: Beagle,
}
```

### Requiring explicit inheritance with `@strictExtends`

Emitters targeting languages without native unions represent a union with an `extends` clause as a polymorphic base type. That representation requires every variant to actually derive from the base type, which structural assignability alone doesn't guarantee.

Apply [`@strictExtends`](../standard-library/built-in-decorators.md#@strictExtends) to turn that requirement into a compile time error:

```typespec
model Dog {
  name: string;
}
model Beagle {
  name: string;
  huntingSkill: string;
}

@strictExtends
union Breed extends Dog {
  beagle: Beagle, // error: `Beagle` is assignable to `Dog` but doesn't extend it.
}
```

`@strictExtends` only adds a constraint when the base type is a model: assignability between scalars is already nominal in TypeSpec, so `@strictExtends` on `union Foo extends string {...}` changes nothing.

A variant that is itself a union satisfies the constraint when all of its own variants do, so unions can still be composed:

```typespec
model Pet {
  name: string;
}
model Cat extends Pet {
  meow: boolean;
}
model Dog extends Pet {
  bark: boolean;
}

union Cats extends Pet {
  cat: Cat,
}

// Ok: every variant of `Cats` extends `Pet`.
@strictExtends
union Pets extends Pet {
  Cats,
  dog: Dog,
}
```

Any type expression can be used as the base type, including scalars, unions and templates.

```typespec
union OperationStatus extends string {
  "Running",
  "Succeeded",
  "Failed",
}
```

:::caution
`extends` on a union does not mean the union is extensible. `union Foo extends string { "a", "b" }` and `union Foo { "a", "b" }` describe exactly the same set of values, and emitters should treat them the same way. To allow additional values, add a variant for them explicitly:

```typespec
union OperationStatus extends string {
  "Running",
  "Succeeded",
  "Failed",
  string,
}
```

:::

`extends` also has no interaction with the [`@discriminator`](../standard-library/built-in-decorators.md#@discriminator) decorator.
