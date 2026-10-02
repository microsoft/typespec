---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Inspect inline suppressions and local linter disables without compiling a project. Inline results include declaration context and source locations; config results include rule-key locations and diagnostics.

```ts
import { collectLinterDisables } from "@typespec/compiler";
import { collectSuppressions, parse } from "@typespec/compiler/ast";

const script = parse(source);
const suppressions = collectSuppressions(script);
const [disables, diagnostics] = collectLinterDisables(configText);
```
