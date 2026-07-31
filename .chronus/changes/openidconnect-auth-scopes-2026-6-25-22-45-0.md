---
changeKind: feature
packages:
  - "@typespec/http"
  - "@typespec/openapi3"
---

Add scope support to `OpenIdConnectAuth`. The model now accepts an optional `Scopes` template parameter (`OpenIdConnectAuth<ConnectUrl, Scopes>`) and the OpenAPI3 emitter emits those scopes on each operation's `openIdConnect` security requirement. The scheme object itself remains unchanged (scopes are discovered via the `openIdConnectUrl`). Existing `OpenIdConnectAuth<Url>` usages are unaffected.
