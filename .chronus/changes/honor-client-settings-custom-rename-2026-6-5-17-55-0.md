---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Honor custom code property replacements (e.g. `[CodeGenMember("Url")]`) in the generated `ClientSettings.BindCore` method so the binding assigns to the renamed property while still reading from the original configuration key.
