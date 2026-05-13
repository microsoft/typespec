---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix duplicate `InputEnumType` entries in the code model for anonymous enums synthesized from inline-union operation parameters. The dedupe key fallback for types with an empty `crossLanguageDefinitionId` no longer relies on `namespace`, since TCGC can emit the same logical anonymous type with an inconsistent namespace across its emission paths.
