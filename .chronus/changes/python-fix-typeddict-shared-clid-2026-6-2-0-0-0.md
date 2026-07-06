---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix dangling `_types.X` references when template-instantiated models (e.g. `ResourceUpdateModel<Foo, FooProperties>`) share a `crossLanguageDefinitionId`. The TypedDict deduplication now pairs each model with its own copy by name, so distinct models such as `CacheUpdate` and `VolumeUpdate` are all rendered in `types.py`.

Also stop emitting unused TypedDicts for response-only models in `types.py`. Output-only models already render as classes in `models/` and are referenced via `_models.X`, so their TypedDict copies (e.g. `GetResponse`) were dead code. The set of TypedDicts (and discriminated-base union aliases) rendered in `types.py` is now the transitive closure of the request-body input models over their base classes, discriminated subtypes and property types. Input body overloads (including spread bodies whose usage lacks the `Input` flag) are still emitted, and any output-only model reachable from an input model — such as a discriminated subtype or an ARM `SystemData` property — is kept so no forward reference is left undefined. This fixes a `NameError` at import time when an output-only union alias (e.g. `Dinosaur = Union[TRex]`) referenced an excluded subtype, and a pyright `reportUndefinedVariable` error when an input model referenced an excluded property type (e.g. `SystemData`).
