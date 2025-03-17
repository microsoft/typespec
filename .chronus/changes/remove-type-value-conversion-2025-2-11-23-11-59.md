---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Remove deprecated type to value conversion. Since the introductions of object values(`#{}`) and array values(`#[]`) using model expressions or tuple where values were expected has been deprecated. It is now an error with a codefix.

  ```diff lang="tsp"
  -@service({title: "My service"})
  +@service(#{title: "My service"})
  ```
