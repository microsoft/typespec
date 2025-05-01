# Interfaces

Interfaces in TypeSpec are used to group and reuse operations. They provide a way to define a contract for what operations a service must implement, allowing for better organization and modularity in your API design.

## Declaring Interfaces

You can declare an interface using the `interface` keyword followed by the name of the interface. For example:

```typespec
interface SampleInterface {
  foo(): int32;
  bar(): string;
}
```

In this example, the `SampleInterface` defines two operations: `foo`, which returns an `int32`, and `bar`, which returns a `string`.

## Composing Interfaces

You can use the `extends` keyword to incorporate operations from other interfaces into a new interface. For example:

```typespec
interface A {
  a(): string;
}

interface B {
  b(): string;
}

interface C extends A, B {
  c(): string;
}
```

In this example, the `C` interface includes all operations from both `A` and `B`, as well as its own operation `c`.

## Interface Templates

Interfaces can also be templated, allowing you to define operations that can work with different types. For example:

```typespec
interface ReadWrite<T> {
  read(): T;
  write(t: T): void;
}
```

In this example, the `ReadWrite` interface is defined with a template parameter `T`, allowing it to be used with any type.

## Templating Interface Operations

Operations defined within an interface can also be templated. For example:

```typespec
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

alias MyReadWrite = ReadWrite<string>;

op myWrite is MyReadWrite.write<int32>;
```

In this example, the `ReadWrite` interface defines operations that can work with different types, and the `myWrite` operation reuses the signature from the `MyReadWrite` alias.

## Summary

Interfaces are a powerful feature in TypeSpec that allow you to group related operations and define contracts for your services. By understanding how to declare interfaces, compose them, and use templates, you can create clear and maintainable TypeSpec definitions.

As you work with TypeSpec, remember to leverage interfaces to improve the organization and modularity of your API.
