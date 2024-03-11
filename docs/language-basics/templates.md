---
id: templates
title: Templates
---

# Templates

Templates are a powerful tool that allow users to customize certain aspects of a type. Similar to generics in other programming languages, templates define template parameters that users can specify when referencing the type.

Templates can be applied to:

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

You can assign a default value to a template parameter using `= <value>`.

```typespec
model Page<Item = string> {
  size: number;
  item: Item[];
}
```

## Parameter constraints

You can impose constraints on template parameters using the `extends` keyword. For details on how validation works, refer to the [type relations](./type-relations.md) documentation.

```typespec
alias Foo<Type extends string> = Type;
```

If you try to instantiate Foo with an argument that does not meet the `string` constraint, you will encounter an error:

```typespec
alias Bar = Foo<123>;
                ^ Type '123' is not assignable to type 'TypeSpec.string'
```

A template parameter constraint can also be a model expression:

```typespec
// Expect Type to be a model with property name: string
alias Foo<Type extends {name: string}> = Type;
```

Default values for template parameters must also adhere to the constraint:

```typespec
alias Foo<Type extends string = "Abc">  = Type
// Invalid
alias Bar<Type extends string = 123>  = Type
                             ^ Type '123' is not assignable to type 'TypeSpec.string'
```

Also, all optional arguments must be placed at the end of the template. A required argument cannot follow an optional argument:

```typespec
// Invalid
alias Foo<T extends string = "Abc", U> = ...;
                                    ^ Required template arguments must not follow optional template arguments
```

## Named template arguments

Template arguments can also be specified by name. This allows you to specify them out of order and omit optional arguments. This can be particularly useful when dealing with templates that have many arguments with defaults:

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

Since template arguments can be specified by name, the names of template parameters are part of the template's public API. **Renaming a template parameter may break existing specifications that use the template.**

**Note**: Template arguments are evaluated in the order the parameters are defined in the template _definition_, not the order in which they are written in the template _instance_. While this is usually inconsequential, it may be important in some cases where evaluating a template argument may trigger decorators with side effects.
