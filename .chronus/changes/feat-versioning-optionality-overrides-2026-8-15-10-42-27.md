---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add experimental explicit optionality overrides for derived properties. Overrides retain same-value transform intent and inherited annotation provenance through compiler and typekit cloning.

```ts
import { unsafe_overridePropertyOptionality } from "@typespec/compiler/experimental";

// In a decorator, pass its context so cloning does not repeat the transform.
unsafe_overridePropertyOptionality(derivedProperty, true, context);
```