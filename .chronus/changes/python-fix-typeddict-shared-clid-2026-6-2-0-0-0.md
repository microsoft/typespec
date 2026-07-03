---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix dangling `_types.X` references when template-instantiated models (e.g. `ResourceUpdateModel<Foo, FooProperties>`) share a `crossLanguageDefinitionId`. The TypedDict deduplication now pairs each model with its own copy by name, so distinct models such as `CacheUpdate` and `VolumeUpdate` are all rendered in `types.py`.

Also stop emitting unused TypedDicts for response-only models in `types.py`. Output-only models already render as classes in `models/` and are referenced via `_models.X`, so their TypedDict copies (e.g. `GetResponse`) were dead code. Input body overloads (including spread bodies whose usage lacks the `Input` flag) are still emitted.
