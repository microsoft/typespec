---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add an experimental, default-off `dev-options.generate-protocol-implementation` flag
for buffered Azure Core V1 HTTP protocol generation. The generated implementation
uses the new `GeneratedCodeUtils` runtime APIs instead of runtime `RestProxy` dispatch.
