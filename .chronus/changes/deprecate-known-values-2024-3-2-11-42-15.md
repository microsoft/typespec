---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate `@knownValues` decorator. Use a named union of string literal with a string variant to achieve the same result without a decorator

Example:
```diff
-enum FooKV { a, b, c}
-@knownValues(FooKV)
-scalar foo extends string;
+union Foo { "a", "b", "c", string }
```
