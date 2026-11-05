---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix browser generation with stable npm releases by loading the generator wheel from the matching npm package. Prerelease playground builds continue using their blob-hosted assets.
