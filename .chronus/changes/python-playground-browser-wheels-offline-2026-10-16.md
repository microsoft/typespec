---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix playground generation by bundling the generator's Python dependency wheels, including Pyodide builds of PyYAML and MarkupSafe, with the emitter instead of resolving them from PyPI or the Pyodide CDN in the browser. The wheels are vendored in the repository so the playground build does not download packages.
