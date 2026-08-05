---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix generated controllers failing to compile when the service namespace starts with `Microsoft.` (as ARM resource providers do). `ControllerBase` and `IActionResult` are now emitted as `Microsoft.AspNetCore.Mvc` library references so they resolve in every namespace instead of being unresolved bare identifiers.
