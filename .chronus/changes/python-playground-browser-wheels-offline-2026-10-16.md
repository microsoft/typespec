---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix playground generation by bundling the generator's Python dependencies with the emitter instead of resolving them from PyPI in the browser. The playground build obtains hash-pinned dependencies from the configured Python feed and builds pure-Python PyYAML and MarkupSafe wheels without downloading from the Pyodide CDN. Update the generator's PyYAML dependency to 6.0.3.
