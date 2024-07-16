---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Do not carry over `@friendlyName` with `model is` or `op is`

  ```tsp
  @friendlyName("Abc{T}", T)
  model Foo<T> {}
  
  model Bar is Foo<string>;
  
  // This can be changed to
  model Abcstring is Foo<string>;
  ```
