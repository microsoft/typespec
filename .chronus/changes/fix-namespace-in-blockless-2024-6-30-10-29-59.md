---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Allow using compact namespace form `Foo.Bar` when inside another namespace
  ```tsp
  namespace MyOrg.MyProject {
    namespace MyModule.MySubmodule { // <-- this used to emit an error
      // ...
    }
  }
  ```
