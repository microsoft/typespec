---
changeKind: feature
packages:
  - "@typespec/http-client"
---

Allow experimental APIs to supply warning text to client emitters:

```typespec
@TypeSpec.HttpClient.experimental(#{ warningText: "This API may change." })
model Preview {
  value: string;
}
```
