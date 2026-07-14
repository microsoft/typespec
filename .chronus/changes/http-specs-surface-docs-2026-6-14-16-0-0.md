---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add a first set of `@surfaceDoc` annotations describing expected client-surface properties that wire tests can't observe: every distinct `Payload.Pageable` scenario now asserts it surfaces as a pageable collection (`paging`), and a `SpecialWords` extensible-enum member asserts its reserved-word name is exposed with an idiomatic, non-conflicting client identifier (`naming`). These feed the generated `surface-checks.md`. Also fixes `Documentation.Lists.bulletPointsModel`, which carried `@scenarioDoc` without `@scenario`.
