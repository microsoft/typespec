---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

`@body` means this is the body

  This change makes using `@body` mean this is the exact body and everything underneath will be included, including metadata properties. If metadata properties are present on the body, a warning will be logged.
  
  ```tsp
  op a1(): {@body _: {@header foo: string, other: string} };
                  ^ warning header in a body, it will not be included as a header.
  ```
  
  Use `@bodyRoot` if you want to only change where to resolve the body from.
  
  ```tsp
  op a1(): {@bodyRoot _: {@header foo: string, other: string} };
  ```

