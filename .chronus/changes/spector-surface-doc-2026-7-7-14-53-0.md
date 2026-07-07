---
changeKind: feature
packages:
  - "@typespec/spector"
---

Add a `@surfaceDoc` decorator and `listSurfaceDocs` for describing, in plain natural language, expected properties of the generated SDK surface (naming, access, inheritance reshaping, operation location, paging, ...) that wire tests can't observe. Authors write the sentence and apply the normal decorator; `listSurfaceDocs` derives the machine-checkable, routable fields from the element's own decorators (`@list`, `@clientName`, `@access`, `@clientLocation`, `@hierarchyBuilding`), falling back to AI verification of the prose when none is recognized. An optional explicit `check` argument lets authors supply a category or routing detail the derivation can't infer. The new `tsp-spector generate-surface-checks` command precomputes a language-neutral `surface-checks.json` manifest from these annotations, analogous to how `@scenarioDoc` feeds the scenario manifest.
