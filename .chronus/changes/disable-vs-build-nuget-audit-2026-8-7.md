---
changeKind: fix
packages:
  - "typespec-vs"
---

Disable NuGet package auditing during cross-platform Visual Studio extension builds so restores do not fail when the vulnerability feed is unavailable.
