---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Using a model expression instead of an object value when expecting a value is deprecated. A codefix will be provided to automatically convert the model expression into a literal.

```tsp
model Test {
  // Deprecated
  user: {name: string} = {name: "System"};
  
  // Correct
  user: {name: string} = #{name: "System"};
```
