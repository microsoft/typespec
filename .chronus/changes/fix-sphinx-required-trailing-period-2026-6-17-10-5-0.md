---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Place docstring annotations such as `Required.` on their own paragraph after a trailing RST code block and stop appending a sentence period inside the block. Previously the period landed on the code block's last line (e.g. `].`) and `Required.` was jammed onto the lead-in sentence, both of which broke Sphinx rendering.
