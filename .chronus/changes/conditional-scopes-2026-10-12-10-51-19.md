---
changeKind: feature
packages:
  - "@typespec/versioning"
---

Compose existing version projections with experimental compiler scope views, including version dependencies and validation before emitter selection.

```ts
import { getScopeViews } from "@typespec/compiler/experimental";
const checkedViews = getScopeViews(program);
```