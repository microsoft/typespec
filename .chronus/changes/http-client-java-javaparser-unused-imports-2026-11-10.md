---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Use JavaParser for unused-import removal, eliminating Google Java Format and its runtime dependencies along with the generator's `--add-exports` JVM options. Preserve imports referenced by declaration Javadocs separated from declarations by comments, and include source context in Java parser diagnostics without misleading carets.
