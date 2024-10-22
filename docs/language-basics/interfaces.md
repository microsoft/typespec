---
id: interfaces
title: Interfaces
---

Interfaces are useful for grouping and reusing [operations](./operations.md).

You can declare interfaces using the `interface` keyword. Its name must be an [`identifier`](./identifiers.md).

```typespec
interface SampleInterface {
  foo(): int32;
  bar(): string;
}
```

## Composing interfaces

You can use the `extends` keyword to incorporate operations from other interfaces into a new interface.

Consider the following interfaces:

```typespec
interface A {
  a(): string;
}

interface B {
  b(): string;
}
```

You can create a new interface `C` that includes all operations from `A` and `B`:

```typespec
interface C extends A, B {
  c(): string;
}
```

This is equivalent to:

```typespec
interface C {
  a(): string;
  b(): string;
  c(): string;
}
```

## Interface templates

Interfaces can be templated. For more details on templates, [see templates](./templates.md).

```typespec
interface ReadWrite<T> {
  read(): T;
  write(t: T): void;
}
```

## Templating interface operations

Operations defined within an interface can also be templated. For more details on templates, [see templates](./templates.md).

```typespec
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

alias MyReadWrite = ReadWrite<string>;

op myWrite is MyReadWrite.write<int32>;
```

:::caution
Any templated operation defined in an interface that is not instantiated will be omitted from the list of service operations.

This also applies when using `extends` on an interface that contains templated operations with unfilled template arguments.

```typespec
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

interface MyReadWrite extends ReadWrite<string> {} // Here, the `read()` operation is fully instantiated and will be included in a service definition. However, `write()` is not.
```

When working with building block interfaces like this, use an alias to create your interface building block instead of `interface extends`. This way, the instantiated interface and its members will not be resolved in the service definition.

```typespec
alias MyReadWrite = ReadWrite<string>;

op myRead is MyReadWrite.read;
op myWrite is MyReadWrite.write<int32>;
```

:::
