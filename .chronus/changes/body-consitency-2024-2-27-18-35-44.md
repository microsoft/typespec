---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

`@body` means this is the body

  This change makes it that using `@body` will mean exactly this is the body and everything underneath will be included, including metadata properties. It will log a warning explaining that.
  
  ```tsp
  op a1(): {@body _: {@header foo: string, other: string} };
                  ^ warning header in a body, it will not be included as a header.
  ```
  
  Solution use `@bodyRoot` as the goal is only to change where to resolve the body from.
  
  ```tsp
  op a1(): {@bodyRoot _: {@header foo: string, other: string} };
  ```

