---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix enum member names derived from date-like TypeSpec labels (e.g. `` `2020-01-01` ``) being corrupted by the js-yaml (YAML 1.2) to PyYAML (YAML 1.1) boundary. String scalars are now force-quoted when serializing the code model so names such as `2020_01_01` round-trip as strings instead of being read back as integers
