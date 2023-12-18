---
id: templates
title: Templates
---

# Templates

It is often useful to let the users of a model fill in certain details. Templates enable this pattern. Similar to generics found in other languages, model templates declare template parameters that users provide when referencing the type.

Templates can be used on:

- [alias](./alias.md)
- [models](./models.md)
- [operations](./operations.md)
- [interfaces](./interfaces.md)

```typespec
model Page<Item> {
  size: number;
  item: Item[];
}

model DogPage {
  ...Page<Dog>;
}
```

## Default values

A template parameter can be given a default value with `= <value>`.

```typespec
model Page<Item = string> {
  size: number;
  item: Item[];
}
```

## Parameter constraints

Template parameter can provide a constraint using the `extends` keyword. See [type relations](./type-relations.md) documentation for details on how validation works.

```typespec
alias Foo<Type extends string> = Type;
```

now instantiating Foo with the wrong type will result in an error

```typespec
alias Bar = Foo<123>;
                ^ Type '123' is not assignable to type 'TypeSpec.string'
```

Template constraints can be a model expression

```typespec
// Expect Type to be a model with property name: string
alias Foo<Type extends {name: string}> = Type;
```

Template parameter default also need to respect the constraint

```typespec
alias Foo<Type extends string = "Abc">  = Type
// Invalid
alias Bar<Type extends string = 123>  = Type
                             ^ Type '123' is not assignable to type 'TypeSpec.string'
```
