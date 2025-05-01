# Templates

Templates in TypeSpec are a powerful feature that allows users to customize certain aspects of a type, similar to generics in other programming languages. Templates define template parameters that users can specify when referencing the type, enabling greater flexibility and reusability in your API definitions.

## Declaring Templates

You can declare a template using the `model`, `interface`, or `alias` keywords followed by the name of the type and the template parameters in angle brackets. For example:

```typespec
model Page<Item> {
  size: int32;
  item: Item[];
}
```

In this example, the `Page` model is defined with a template parameter `Item`, allowing it to represent a collection of items of any type.

## Default Values

You can assign a default value to a template parameter using the `= <value>` syntax. For example:

```typespec
model Page<Item = string> {
  size: int32;
  item: Item[];
}
```

In this case, if no type is specified for `Item`, it will default to `string`.

## Parameter Constraints

You can impose constraints on template parameters using the `extends` keyword. This allows you to restrict the types that can be used as arguments for the template. For example:

```typespec
alias Foo<Type extends string> = Type;
```

If you try to instantiate `Foo` with an argument that does not meet the `string` constraint, you will encounter an error:

```typespec
alias Bar = Foo<123>; // Error: Type '123' is not assignable to type 'TypeSpec.string'
```

## Named Template Arguments

Template arguments can also be specified by name, allowing you to specify them out of order and omit optional arguments. For example:

```typespec
alias Test<T, U extends numeric = int32, V extends string = "example"> = {
  t: T;
  v: V;
};

// Specify the argument V by name to skip argument U
alias Example1 = Test<unknown, V = "example1">;
```

Once a template argument is specified by name, all subsequent arguments must also be specified by name.

## Templates with Values

Templates can be declared to accept values using a `valueof` constraint. This is useful for providing default values and parameters for decorators that take values. For example:

```typespec
alias TakesValue<StringType extends string, StringValue extends valueof string> = {
  @doc(StringValue)
  property: StringType;
};

alias M1 = TakesValue<"a", "b">;
```

## Summary

Templates are a powerful feature in TypeSpec that enhance the flexibility and reusability of your API definitions. By understanding how to declare templates, assign default values, impose constraints, and use named template arguments, you can create clear and maintainable TypeSpec definitions.

As you work with TypeSpec, remember to leverage templates to create versatile and reusable components in your API.
