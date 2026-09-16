---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add a `fixedOrder` option to `expectDiagnostics`. Set it to `false` to match expected diagnostics regardless of their emitted order.

```ts
import { expectDiagnostics } from "@typespec/compiler/testing";

expectDiagnostics(diagnostics, [{ code: "second" }, { code: "first" }], {
  fixedOrder: false,
});
```

Each expectation matches a distinct diagnostic. Ordered, strict matching remains the default.
