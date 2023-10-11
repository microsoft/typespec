---
id: interfaces
title: Interfaces
---

# Interfaces

Interfaces can be used to group and reuse [operations](./operations.md).

Interfaces are declared using the `interface` keyword.

```typespec
interface SampleInterface {
  foo(): int32;
  bar(): string;
}
```

## Composing interfaces

The keyword `extends` can be used to compose operations from other interfaces into a new interface.

Given the following interfaces

```typespec
interface A {
  a(): string;
}

interface B {
  b(): string;
}
```

a new interface `C` can be created including all operations from `A` and `B`

```typespec
interface C extends A, B {
  c(): string;
}
```

which is equivalent to

```typespec
interface C {
  a(): string;
  b(): string;
  c(): string;
}
```

## Interface template

Interfaces can be templated, [see templates](./templates.md) for details on templates.

```typespec
interface ReadWrite<T> {
  read(): T;
  write(t: T): void;
}
```

## Interface operation templates

Operations defined inside of an interface can also be templated. ([see templates](./templates.md) for details on templates.)

```typespec
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

alias MyReadWrite = ReadWrite<string>;

op myWrite is MyReadWrite.write<int32>;
```

:::caution
Any uninstantiated, templated operation defined in an interface will be excluded from the list of service operations.

This also applies when using `extends` on an interface that contains templated operations with unfilled template arguments.

```typespec
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

interface MyReadWrite extends ReadWrite<string> {} // Here the `read()` operation is fully instantiated and will be included in a service definition. `write()` however isn't.
```

When working with building block interface like this use alias to create your interface building block instead of `interface extends`. This way the instantiated interface and its member will not be resolved in the service definition.

```typespec
alias MyReadWrite = ReadWrite<string>;

op myRead is MyReadWrite.read;
op myWrite is MyReadWrite.write<int32>;
```

:::
