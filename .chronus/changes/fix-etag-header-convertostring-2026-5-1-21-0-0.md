---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix `RestClientProvider` wrapping string-derived custom scalar header parameters (such as `Azure.Core.eTag`) with `TypeFormatters.ConvertToString`. When a header parameter's input type is a primitive that derives from `string` (directly or transitively), the value is now passed through directly so generator plugins that post-process the header expression do not produce invalid code such as `TypeFormatters.ConvertToString(ifMatch).Value`.
