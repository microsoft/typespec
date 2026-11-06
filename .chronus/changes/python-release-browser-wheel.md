---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Load the browser generator wheel relative to the emitter's JavaScript bundle, so local, PR-preview, and published playgrounds can ship the matching wheel alongside it without version-specific download hosts.
