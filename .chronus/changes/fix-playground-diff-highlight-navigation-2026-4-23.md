---
changeKind: fix
packages:
  - "@typespec/playground"
---

Fix diff highlighting in the output viewer not appearing when navigating to a changed file. Previously, line-level highlights would only appear for the file that happened to be open when compilation finished, because the editor's content swap (triggered by an asynchronous file load on navigation) cleared the decorations without re-applying them. Highlights now show whenever a changed file is navigated to and persist until the next compilation.
