---
jsApi: true
title: "[F] joinPaths"

---
```ts
joinPaths(path, ...paths): string
```

Combines paths. If a path is absolute, it replaces any previous path. Relative paths are not simplified.

```ts
// Non-rooted
joinPaths("path", "to", "file.ext") === "path/to/file.ext"
joinPaths("path", "dir", "..", "to", "file.ext") === "path/dir/../to/file.ext"
// POSIX
joinPaths("/path", "to", "file.ext") === "/path/to/file.ext"
joinPaths("/path", "/to", "file.ext") === "/to/file.ext"
// DOS
joinPaths("c:/path", "to", "file.ext") === "c:/path/to/file.ext"
joinPaths("c:/path", "c:/to", "file.ext") === "c:/to/file.ext"
// URL
joinPaths("file:///path", "to", "file.ext") === "file:///path/to/file.ext"
joinPaths("file:///path", "file:///to", "file.ext") === "file:///to/file.ext"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
| ...`paths` | (`undefined` \| `string`)[] |
