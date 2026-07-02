---
changeKind: fix
packages:
  - "@typespec/standalone-cli"
---

Use compiler version for standalone CLI distribution versioning to fix version mismatch between `tsp --version` output and package manager listings (Scoop, winget, Homebrew).
