---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add support for node `exports` field. Specific typespec exports can be provided with the `typespec` field

```json
"exports": {
  ".": {
    "typespec": "./lib/main.tsp",
  },
  "./named": {
    "typespec": "./lib/named.tsp",
  }
}
```
