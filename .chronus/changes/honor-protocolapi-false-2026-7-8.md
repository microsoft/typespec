---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Honor `@protocolAPI(false)` by generating the protocol method as `internal` instead of `public`. The method (and its body) is kept rather than omitted, so the convenience method still delegates to it. The convenience method remains public.
