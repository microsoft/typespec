---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Support completion for object values and model expression properties.

  Example
  ```tsp
  model User {
    name: string;
    age: int32;
    address: string;
  }

  const user: User = #{name: "Bob", ┆}
                                    | [age]
                                    | [address]
  ```

