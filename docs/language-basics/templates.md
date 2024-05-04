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

## Templates with values

Templates can be declared to accept values using a `valueof` constraint. This is useful for providing default values and parameters for decorators that take values.

```typespec
alias TakesValue<StringType extends string, StringValue extends valueof string> = {
  @doc(StringValue)
  property: StringType;
};

alias M1 = TakesValue<"a", "b">;
```

When a passing a literal or an enum or union member reference directly as a template parameter that accepts either a type or a value, we pass the value. In particular, `StringTypeOrValue` is a value with the string literal type `"a"`.

```typespec
alias TakesTypeOrValue<StringTypeOrValue extends string | (valueof string)> = {
  @customDecorator(StringOrValue)
  property: string;
};

alias M1 = TakesValue<"a">;
```

The [`typeof` operator](./values.md#the-typeof-operator) can be used to get the declared type of a value if needed.

### Template parameter value types

When a template is instantiated with a value, the type of the value and the result of the `typeof` operator is determined based on the argument rather than the template parameter constraint. This follows the same rules as [const declaration type inference](./values.md#const-declarations). In particular, inside the template `TakesValue`, the type of `StringValue` is the string literal type `"b"`. If we passed a `const` instead, the type of the value would be the const's type. In the following example, the type of `property` in `M1` is `"a" | "b"`.

```typespec
alias TakesValue<
  StringValue extends valueof string
> = {
  @doc(StringValue)
  property: typeof StringValue;
};

const str: "a" | "b" = "a";
alias M1 = TakesValue<str>;
```
