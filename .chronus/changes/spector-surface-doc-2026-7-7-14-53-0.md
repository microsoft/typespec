---
changeKind: feature
packages:
  - "@typespec/spector"
---

Add a `@surfaceDoc` decorator and `listSurfaceDocs` for asserting expected properties of the generated SDK surface (naming, access, inheritance, operation location, paging, ...) that wire tests can't observe. Each check is fully explicit and deterministic: the author states the `category`, the `subject` the check is about, and the `expected` client-surface output — nothing is inferred from other decorators. `expected` is normally a single canonical string each emitter recasts to its idiomatic form, but may instead be a `scope → value` dict (e.g. `#{ python: "io_thing" }`) whose values are matched verbatim for that language — for names that can't be derived by casing. `@surfaceDoc` may only be applied to an element that also carries `@scenarioDoc`, keeping every check grounded in a documented scenario. The `category` is an extensible union, so new categories can be added without changing this library; a category an emitter has no verifier for falls back to AI verification of the prose. The `tsp-spector` surface-checks command precomputes a language-neutral manifest from these annotations, analogous to how `@scenarioDoc` feeds the scenario manifest.

```tsp
@scenario
@scenarioDoc("Enum declared as extensible so unknown values round-trip.")
@surfaceDoc("naming", MyEnum, "ClientExtensibleEnum")
op get(): MyEnum;

// per-language exact names (matched verbatim) when casing can't derive them
@scenario
@scenarioDoc("Reserved-word acronym surfaces differently per language.")
@surfaceDoc("naming", IOThing, #{ python: "io_thing", csharp: "IOThing" })
op getThing(): IOThing;
```
