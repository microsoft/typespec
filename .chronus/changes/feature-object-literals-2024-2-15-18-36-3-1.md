---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Using a tuple type as a value is deprecated. Tuple types in contexts where values are expected must be updated to be array values instead. A codefix is provided to automatically convert tuple types into array values.

```tsp
model Test {
  // Deprecated
  values: string[] = ["a", "b", "c"];
  
  // Correct
  values: string[] = #["a", "b", "c"];
```
