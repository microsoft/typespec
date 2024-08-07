---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Fix issue where naming a namespace with the same name as the blockless namespace would merge with it instead of creating a subnamespace like any other name would.

  ```tsp
  namespace MyOrg.MyProject;

  namespace MyOrg.MyProject.MyArea {
    model A {}
  }

  namespace MyArea2 {
    model B {}
  }
  ```

  Previously model `A` would end-up in namespace `MyOrg.MyProject.MyArea` and model `B` in `MyOrg.MyProject.MyArea2`. With this change model `A` will now be in `MyOrg.MyProject.MyOrg.MyProject.MyArea`. To achieve the previous behavior the above code should be written as:

  ```tsp
  namespace MyOrg.MyProject;

  namespace MyArea {
    model A {}
  }

  namespace MyArea2 {
    model B {}
  }
  ```
