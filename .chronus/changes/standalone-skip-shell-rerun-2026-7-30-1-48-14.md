---
changeKind: fix
packages:
  - "@typespec/standalone-cli"
---

Fix install script adding duplicate PATH entries to shell config files (`.bashrc`, `.zshrc`, etc.) on subsequent runs. The script now detects if TypeSpec is already configured and skips the shell update. Also fix `--skip-shell` flag which was using an inconsistent variable name and had no effect.
