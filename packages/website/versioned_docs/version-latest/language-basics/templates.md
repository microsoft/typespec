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

```cadl
model Page<T> {
  size: number;
  item: T[];
}

model DogPage {
  ...Page<Dog>;
}
```

## Default values

A template parameter can be given a default value with `= <value>`.

```cadl
model Page<T = string> {
  size: number;
  item: T[];
}
```

## Parameter constraints

Template parameter can provide a constraint using the `extends` keyword. See [type relations](./type-relations.md) documentation for details on how validation works.

```cadl
alias Foo<T extends string> = T;
```

now instantiating Foo with the wrong type will result in an error

```cadl
alias Bar = Foo<123>;
                ^ Type '123' is not assignable to type 'Cadl.string'
```

Template constraints can be a model expression

```cadl
// Expect T to be a model with property name: string
alias Foo<T extends {name: string}> = T;
```

Template parameter default also need to respect the constraint

```cadl
alias Foo<T extends string = "Abc">  = T
// Invalid
alias Bar<T extends string = 123>  = T
                             ^ Type '123' is not assignable to type 'Cadl.string'
```
