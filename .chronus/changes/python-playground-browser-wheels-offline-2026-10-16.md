---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix playground generation by bundling the generator's Python dependency wheels with the emitter instead of resolving them from PyPI in the browser. The playground build now reads Pyodide metadata from the pinned `pyodide` npm package so it does not depend on the Pyodide CDN.
