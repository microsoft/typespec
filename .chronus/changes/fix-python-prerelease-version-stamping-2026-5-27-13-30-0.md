---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix CI publish failures by stamping prerelease version in Build-Packages.ps1. The `-Prerelease` flag was accepted but unused, causing every CI build to produce the same version and fail with a 409 conflict on the DevOps feed.
