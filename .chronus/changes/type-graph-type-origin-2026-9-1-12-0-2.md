---
changeKind: feature
packages:
  - "@typespec/html-program-viewer"
---

Show where a type was declared (your code, the standard library or a library) in the type view, with its file and line. When the host provides the new `onRevealSource` callback, clicking the badge of a type declared in your code reveals its declaration.
