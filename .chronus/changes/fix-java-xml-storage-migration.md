---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix optional unwrapped XML lists, bodyless success responses, and raw binary responses mixed with structured successes or content types. Report unsupported XML dictionaries and additional properties before generating invalid Java.
