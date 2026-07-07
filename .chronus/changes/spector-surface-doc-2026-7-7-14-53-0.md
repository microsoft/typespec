---
changeKind: feature
packages:
  - "@typespec/spector"
---

Add a `@surfaceDoc` decorator and `listSurfaceDocs` for describing, in plain natural language, expected properties of the generated SDK surface (naming, access, inheritance reshaping, operation location, ...) that wire tests can't observe. Authors write the sentence and apply the normal client decorator; `listSurfaceDocs` derives the machine-checkable, routable fields from the element's own client decorators (falling back to AI verification of the prose when none is recognized). The new `tsp-spector generate-surface-checks` command precomputes a language-neutral `surface-checks.json` manifest from these annotations, analogous to how `@scenarioDoc` feeds the scenario manifest.
