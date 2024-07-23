---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Support completion for template parameter extending model or object value

  Example
  ```tsp
  model User<T extends {name: string, age: int16}> {
  }
  alias user = User< {┆
                      | [age]
                      | [name]
  ```
