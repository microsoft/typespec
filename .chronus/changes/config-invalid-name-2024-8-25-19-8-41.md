---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Introducing a new rule: `config-valid-name`
This rule prevents the use of configuration names with dots (e.g., test.name), as dots can cause conflicts with nested configuration values.
