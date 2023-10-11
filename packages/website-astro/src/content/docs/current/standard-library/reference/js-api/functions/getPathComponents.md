---
jsApi: true
title: "[F] getPathComponents"

---
```ts
getPathComponents(path, currentDirectory): string[]
```

Parse a path into an array containing a root component (at index 0) and zero or more path
components (at indices > 0). The result is not normalized.
If the path is relative, the root component is `""`.
If the path is absolute, the root component includes the first path separator (`/`).

```ts
// POSIX
getPathComponents("/path/to/file.ext") === ["/", "path", "to", "file.ext"]
getPathComponents("/path/to/") === ["/", "path", "to"]
getPathComponents("/") === ["/"]
// DOS
getPathComponents("c:/path/to/file.ext") === ["c:/", "path", "to", "file.ext"]
getPathComponents("c:/path/to/") === ["c:/", "path", "to"]
getPathComponents("c:/") === ["c:/"]
getPathComponents("c:") === ["c:"]
// URL
getPathComponents("http://typescriptlang.org/path/to/file.ext") === ["http://typescriptlang.org/", "path", "to", "file.ext"]
getPathComponents("http://typescriptlang.org/path/to/") === ["http://typescriptlang.org/", "path", "to"]
getPathComponents("http://typescriptlang.org/") === ["http://typescriptlang.org/"]
getPathComponents("http://typescriptlang.org") === ["http://typescriptlang.org"]
getPathComponents("file://server/path/to/file.ext") === ["file://server/", "path", "to", "file.ext"]
getPathComponents("file://server/path/to/") === ["file://server/", "path", "to"]
getPathComponents("file://server/") === ["file://server/"]
getPathComponents("file://server") === ["file://server"]
getPathComponents("file:///path/to/file.ext") === ["file:///", "path", "to", "file.ext"]
getPathComponents("file:///path/to/") === ["file:///", "path", "to"]
getPathComponents("file:///") === ["file:///"]
getPathComponents("file://") === ["file://"]
```

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `path` | `string` | `undefined` |
| `currentDirectory` | `string` | `""` |
