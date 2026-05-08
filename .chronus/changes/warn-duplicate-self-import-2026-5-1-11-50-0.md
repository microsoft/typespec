---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added warnings for duplicate imports and self-imports in the same file

The compiler now warns when a file imports itself or contains duplicate import statements. These are likely mistakes and while they don't cause errors, they add unnecessary noise.

```tsp
import "./main.tsp"; // Warning: A file cannot import itself.

import "./other.tsp";
import "./other.tsp"; // Warning: Duplicate import of "./other.tsp"
```
