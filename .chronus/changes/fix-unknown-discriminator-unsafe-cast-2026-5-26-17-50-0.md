---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix unsafe cast in explicit `IJsonModel<T>.Create` / `IPersistableModel<T>.Create` implementations on unknown discriminator models. The generated code previously cast the `*CreateCore(...)` result to the concrete unknown type (e.g. `UnknownPet`), which could throw `InvalidCastException` when the base discriminator deserializer returned another subtype. The cast now uses the interface return type (e.g. `Pet`).
