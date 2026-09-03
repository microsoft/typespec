---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `sanitizePathSegment` helper to make a value coming from a TypeSpec spec safe to use as a single path segment. Path separators, drive letter separators and values only made of `.` are replaced with `_`.

```ts
sanitizePathSegment("2021-10-01-preview"); // "2021-10-01-preview"
sanitizePathSegment("../../etc/passwd"); // ".._.._etc_passwd"
```
