---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Using a model type as a value is deprecated. Model types in contexts where values are expected must be updated to be object values instead. A codefix is provided to automatically convert model types into object values.

```tsp
model Test {
  // Deprecated
  user: {name: string} = {name: "System"};
  
  // Correct
  user: {name: string} = #{name: "System"};
```
