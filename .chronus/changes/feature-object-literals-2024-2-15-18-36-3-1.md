---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Using a tuple expression instead of a array literal when expecting a value is deprecated. A codefix will be provided to automatically convert tuple expressions into a literal.

```tsp
model Test {
  // Deprecated
  values: string[] = ["a", "b", "c"];
  
  // Correct
  values: string[] = #["a", "b", "c"];
```
