---
jsApi: true
title: "[F] ensurePathIsNonModuleName"

---
```ts
ensurePathIsNonModuleName(path): string
```

Ensures a path is either absolute (prefixed with `/` or `c:`) or dot-relative (prefixed
with `./` or `../`) so as not to be confused with an unprefixed module name.

```ts
ensurePathIsNonModuleName("/path/to/file.ext") === "/path/to/file.ext"
ensurePathIsNonModuleName("./path/to/file.ext") === "./path/to/file.ext"
ensurePathIsNonModuleName("../path/to/file.ext") === "../path/to/file.ext"
ensurePathIsNonModuleName("path/to/file.ext") === "./path/to/file.ext"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

## Returns

`string`
