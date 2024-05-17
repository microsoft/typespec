---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Support completion for Model with extended properties

  Example
  ```tsp
  model Device {
    name: string;
    description: string;
  }

  model Phone extends Device {
    ┆
  } | [name]
    | [description]
  ```

