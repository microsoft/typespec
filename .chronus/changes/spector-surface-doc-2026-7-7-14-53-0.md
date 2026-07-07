---
changeKind: feature
packages:
  - "@typespec/spector"
---

Add a `@surfaceDoc` decorator and `listSurfaceDocs` for describing expected properties of the generated SDK surface (naming, access, inheritance reshaping, operation location, ...) that wire tests can't observe. A single `@surfaceDoc` may carry multiple checks. The new `tsp-spector generate-surface-checks` command precomputes a language-neutral `surface-checks.json` manifest from these annotations, analogous to how `@scenarioDoc` feeds the scenario manifest.
