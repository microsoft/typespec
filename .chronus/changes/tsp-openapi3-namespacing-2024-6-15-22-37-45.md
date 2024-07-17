---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Updates tsp-openapi3 to escape identifiers that would otherwise be invalid, and automatically resolve namespaces for schemas with dots in their names.