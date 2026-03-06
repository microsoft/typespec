---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix controller generation to use correct ASP.NET Core result methods for non-200/204 status codes. Previously all operations returned `Ok(...)` or `NoContent()` regardless of the declared status code. Now operations returning 202 use `Accepted(...)`, and other status codes use `StatusCode(code, ...)`.
