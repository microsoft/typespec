---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Inspect inline suppressions and local linter disables without compiling a project. Inline results include declaration context and source locations; config results include rule-key locations and diagnostics. For compiled programs, inspect whether each project suppression matched a diagnostic using `getSuppressions`.

```ts
import { collectLinterDisables } from "@typespec/compiler";
import { collectSuppressions, getSuppressions, parse } from "@typespec/compiler/ast";

const script = parse(source);
const suppressions = collectSuppressions(script);
const [disables, diagnostics] = collectLinterDisables(configText);
const observedSuppressions = getSuppressions(program); // Includes a `used` flag.
```

Usage is a snapshot of diagnostics matched so far in that compilation, including rejected attempts to suppress errors. An unmatched suppression may be needed under other settings: its rule could be disabled, its diagnostic source unavailable, its emitter skipped, or compilation could stop before the relevant stage runs.
