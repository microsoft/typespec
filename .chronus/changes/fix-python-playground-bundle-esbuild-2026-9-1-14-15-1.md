---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix playground bundle publish failing with esbuild errors ("Could not resolve child_process/crypto/fs/promises/os") by moving the browser-safe YAML serialization helper out of a module that also contains Node-only code
