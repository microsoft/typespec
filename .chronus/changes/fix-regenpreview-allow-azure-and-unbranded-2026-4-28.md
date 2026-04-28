---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: internal
packages:
  - "@typespec/http-client-csharp"
---

Allow combining `-Azure`, `-Unbranded`, and `-Mgmt` parameters in `RegenPreview.ps1` so that artifacts for multiple emitters can be built and repackaged in a single run.
