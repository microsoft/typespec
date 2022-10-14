---
id: interfaces
title: Interfaces
---

# Interfaces

Interfaces can be used to group and reuse [operations]({%doc "operations"%}).

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

Interfaces can be templated, [see templates]({%doc "templates"%}) for details on templates.

```cadl
interface ReadWrite<T> {
  read(): T;
  write(t: T): void;
}
```
