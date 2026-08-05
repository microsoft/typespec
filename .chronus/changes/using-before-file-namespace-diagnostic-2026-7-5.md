---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Report a dedicated error, with a quick fix, when a `using` declared before the file-level(blockless) namespace only resolves relative to that namespace.

```tsp
using Models;
namespace MyOrg.Service;
```

```ansi
error using-before-file-namespace: Unknown identifier Models. `using` statements declared before the file namespace are resolved from the global namespace. Did you mean MyOrg.Models?
```
