---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixes template argument resolution when a default template parameter value is resolved by a parent container (e.g. interface)
For example:
```tsp
interface Resource<T> {
  read<U = T>(): U;
}

model Foo {
  type: "foo";
}

alias FooResource = Resource<Foo>;

op readFoo is FooResource.read;
```
The `returnType` for `readFoo` would be model `Foo`. Previously the `returnType` resolved to a `TemplateParameter`.
