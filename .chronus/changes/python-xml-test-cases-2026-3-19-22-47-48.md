---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add mock API test cases for XML scenarios introduced in https://github.com/microsoft/typespec/pull/10063, covering: renamed property, nested model, renamed nested model, wrapped primitive with custom item names, model array variants (wrapped/unwrapped/renamed), renamed attribute, namespace, and namespace-on-properties. Tests for unwrapped model array serialization and namespace handling are skipped pending generator bug fixes.
