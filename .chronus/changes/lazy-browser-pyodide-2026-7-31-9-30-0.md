---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Only boot the Pyodide runtime in the browser on the first emit instead of when the emitter module is imported. Hosts such as the TypeSpec playground import every available emitter up front, so the eager bootstrap downloaded a full CPython WebAssembly runtime and its wheels on every page load, which prevented the page from loading on mobile browsers.
