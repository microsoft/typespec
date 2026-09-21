---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix `@encode` on nullable properties and parameters in OpenAPI 3.1 and 3.2. The encoding is now applied to the `T` member of `anyOf: [T, { type: "null" }]` instead of being written next to `anyOf`. When the encoding changed the emitted type, like `unixTimestamp`, `seconds` or `@encode(string)` on a number, the old schema rejected every value. When the encoded type stayed a string, like `rfc7231` on `utcDateTime` or `base64url` on `bytes`, it only rejected `null`. `bytes | null` now also gets `contentEncoding` instead of `format`.
