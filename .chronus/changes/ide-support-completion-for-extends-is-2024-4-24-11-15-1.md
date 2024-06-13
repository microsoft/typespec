---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Support completion for keyword 'extends' and 'is'

  Example
  ```tsp
  model Dog ┆ {}
            | [extends]
            | [is]
  
  scalar Addresss ┆ 
                  | [extends]

  op jump ┆ 
          | [is]
  
  interface ResourceA ┆ {}
                      | [extends]

  model Cat<T ┆> {}
              | [extends]
  ```

