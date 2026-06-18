---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Place docstring annotations such as `Required.` in front of the description when it ends with an RST code block, and stop appending a sentence period inside the block. Previously the period landed on the code block's last line (e.g. `].`) and `Required.` was appended after the block (`]. Required.`), both of which broke Sphinx rendering.
