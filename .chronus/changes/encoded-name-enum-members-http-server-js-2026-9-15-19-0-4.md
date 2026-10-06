---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Enum members use their `application/json` `@encodedName` as their value, including members with an explicit value. Generated string literals keep the escapes `JSON.stringify` writes: `escapeUnsafeChars` doubled every backslash, so a string literal or enum value containing a quote, a backslash or a newline generated invalid or different code. Enum declarations now escape their values the same way as other literals.
