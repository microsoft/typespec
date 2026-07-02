---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix dangling `_types.X` references when template-instantiated models (e.g. `ResourceUpdateModel<Foo, FooProperties>`) share a `crossLanguageDefinitionId`. The TypedDict dedup now pairs each model with its own copy by name, so distinct models such as `CacheUpdate` and `VolumeUpdate` are all rendered in `types.py`.
