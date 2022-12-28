---
id: interfaces
title: Interfaces
---

# Interfaces

Interfaces can be used to group and reuse [operations](./operations.md).

Interfaces are declared using the `interface` keyword.

```cadl
interface SampleInterface {
  foo(): int32;
  bar(): string;
}
```

## Composing interfaces

The keyword `extends` can be used to compose operations from other interfaces into a new interface.

Given the following interfaces

```cadl
interface A {
  a(): string;
}

interface B {
  b(): string;
}
```

a new interface `C` can be created including all operations from `A` and `B`

```cadl
interface C extends A, B {
  c(): string;
}
```

which is equivalent to

```cadl
interface C {
  a(): string;
  b(): string;
  c(): string;
}
```

## Interface template

Interfaces can be templated, [see templates](./templates.md) for details on templates.

```cadl
interface ReadWrite<T> {
  read(): T;
  write(t: T): void;
}
```

## Interface operation templates

Operations defined inside of interface can also be templated. ([see templates](./templates.md) for details on templates.)

```cadl
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

alias MyReadWrite = ReadWrite<string>;

op myWrite is MyReadWrite.write<int32>;
```

:::caution
Interface having some operation templated and some not will result in the non templated operation being picked up as operation for the service.

This applies as well if using `extends` on a templated interface that has only some templated operation.

```cadl
interface ReadWrite<T> {
  read(): T;
  write<R>(t: T): R;
}

interface MyReadWrite extends ReadWrite<string> {} // Here the `read()` operation is fully instantiated and will be included in a service definition. `write()` however isn't.
```

When working with building block interface like this use alias to create your interface building block instead of `interface extends`. This way the instantiated interface and its member will not be resolved in the service definition.

```cadl
alias MyReadWrite = ReadWrite<string>;

op myRead is MyReadWrite.read;
op myWrite is MyReadWrite.write<int32>;
```

:::
