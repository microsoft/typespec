---
changeKind: dependencies
packages:
  - "@typespec/http-client-csharp"
---

Update `rimraf` and add an npm override to pin `glob` to a non-deprecated version (`^13.0.3`) so that `Update-PackageJson.ps1` no longer surfaces `npm warn deprecated glob@*` warnings during `npm install`.
