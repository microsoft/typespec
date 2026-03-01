---
changeKind: fix
packages:
  - "@typespec/compiler"
---

compiler - Respect npm `registry` and `strict-ssl` configuration when fetching package manifests and downloading packages. This fixes `TypeError: fetch failed` errors caused by SSL certificate issues behind corporate firewalls.
