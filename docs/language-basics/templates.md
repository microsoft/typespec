---
id: templates
title: Templates
---

# Templates

It is often useful to let the users of a model fill in certain details. Templates enable this pattern. Similar to generics found in other languages, model templates declare template parameters that users provide when referencing the type.

Templates can be used on:

- [aliases](./alias.md)
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

A template parameter can be given a default argument value with `= <value>`.

```typespec
model Page<Item = string> {
  size: number;
  item: Item[];
}
```

## Parameter constraints

Template parameters can specify a constraint using the `extends` keyword. See the [type relations](./type-relations.md) documentation for details on how validation works.

```typespec
alias Foo<Type extends string> = Type;
```

Now, instantiating Foo with an argument that does not satisfy the constraint `string` will result in an error:

```typespec
alias Bar = Foo<123>;
                ^ Type '123' is not assignable to type 'TypeSpec.string'
```

A template parameter constraint can also be a model expression:

```typespec
// Expect Type to be a model with property name: string
alias Foo<Type extends {name: string}> = Type;
```

Template parameter defaults also need to respect the constraint:

```typespec
alias Foo<Type extends string = "Abc">  = Type
// Invalid
alias Bar<Type extends string = 123>  = Type
                             ^ Type '123' is not assignable to type 'TypeSpec.string'
```

Furthermore, all optional arguments must come at the end of the template. A required argument cannot follow an optional argument:

```typespec
// Invalid
alias Foo<T extends string = "Abc", U> = ...;
                                    ^ Required template arguments must not follow optional template arguments
```

## Named template arguments

Template arguments may also be specified by name. In that case, they can be specified out of order and optional arguments may be omitted. This can be useful when dealing with templates that have many defaultable arguments:

```typespec
alias Test<T, U extends numeric = int32, V extends string = "example"> = ...;

// Specify the argument V by name to skip argument U, since U is optional and we
// are okay with its default
alias Example1 = Test<unknown, V = "example1">;

// Even all three arguments can be specified out of order
alias Example2 = Test<
  V = "example2",
  T = unknown,
  U = uint64
>;
```

However, once a template argument is specified by name, all subsequent arguments must also be specified by name:

```typespec
// Invalid
alias Example3 = Test<
  V = "example3",
  unknown,
  ^^^^^^^ Positional template arguments cannot follow named arguments in the same argument list.
>;
```

Since template arguments may be specified by name, the names of template parameters are part of the public API of a template. **Changing the name of a template parameter may break existing specifications that use the template.**

**Note**: Template arguments are evaluated in the order the parameters are defined in the template _definition_, not the order in which they are written in the template _instance_. Most of the time, this should not matter, but may be important in some cases where evaluating a template argument may invoke decorators with side effects.
