# Scalars

Scalars are simple types in TypeSpec that do not have any fields. They represent the most basic data types, such as `string`, `int32`, `boolean`, and others. Scalars are essential for defining the structure of your models and operations.

## Declaring Scalars

You can declare a scalar using the `scalar` keyword followed by the name of the scalar. The name must be a valid identifier. For example:

```typespec
scalar ternary;
```

In this example, a scalar named `ternary` is declared.

## Extending Scalars

You can create a new scalar that extends an existing one using the `extends` keyword. This allows you to define custom types based on existing scalar types. For example:

```typespec
scalar Password extends string;
```

In this case, the `Password` scalar is defined as a type that extends the `string` type, allowing you to enforce specific constraints or behaviors.

## Scalars with Template Parameters

Scalars can also support template parameters, which are primarily used for decorators. For example:

```typespec
@doc(Type)
scalar Unreal<Type extends valueof string>;
```

This declaration defines a scalar named `Unreal` that takes a template parameter `Type`, constrained to be a value of type `string`.

## Scalar Initializers

You can declare scalars with initializers to create specific scalar values based on other values. For example:

```typespec
scalar ipv4 extends string {
  init fromInt(value: uint32);
}

const homeIp = ipv4.fromInt(2130706433);
```

In this example, the `ipv4` scalar extends `string` and includes an initializer `fromInt` that converts a `uint32` value to an IPv4 address. Note that initializers do not have any runtime code associated with them; they merely record the scalar initializer invoked along with the arguments passed.

## Summary

Scalars are fundamental building blocks in TypeSpec that allow you to define the basic data types used in your models and operations. By understanding how to declare, extend, and use scalars effectively, you can create clear and maintainable TypeSpec definitions.

As you work with TypeSpec, remember to leverage scalars to represent simple data types and enhance the structure of your API.
