---
changeKind: feature
packages:
  - "@typespec/versioning"
---

Register service versions as experimental scope view axes, so `when since(Versions.v2)` conditions are checked per version, with dependency versions implied by the root service and pinned `@useDependency` versions respected.

```ts
import { getScopeViews } from "@typespec/compiler/experimental";
const service = getScopeViews(program)[0].getGlobalNamespaceType();
```
