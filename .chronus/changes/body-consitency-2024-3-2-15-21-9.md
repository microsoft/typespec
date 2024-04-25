---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

Properties are not automatically omitted if everything was removed from metadata or visibility

  ```tsp
  op d1(): {headers: {@header foo: string}}; // body will be {headers: {}}
  ```
  
  Solution: use `@bodyIgnore`
  
  ```tsp
  op d1(): {@bodyIgnore headers: {@header foo: string}}; // body will be {headers: {}}
  ```
