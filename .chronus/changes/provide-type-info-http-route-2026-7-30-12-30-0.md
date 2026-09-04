---
changeKind: feature
packages:
  - "@typespec/http"
---

Add a `$provideTypeInfo` provider that surfaces the resolved HTTP route (verb and URI template) and response status codes of an operation. This is shown when hovering an operation in the IDE and can be queried programmatically via `program.getTypeInfo(operation)`.

```ts
const info = program.getTypeInfo(operation);
// { content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`" }
```
