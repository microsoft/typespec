---
jsApi: true
title: "[F] resolvePath"

---
```ts
resolvePath(path, ...paths): string
```

Combines and resolves paths. If a path is absolute, it replaces any previous path. Any
`.` and `..` path components are resolved. Trailing directory separators are preserved.

```ts
resolvePath("/path", "to", "file.ext") === "path/to/file.ext"
resolvePath("/path", "to", "file.ext/") === "path/to/file.ext/"
resolvePath("/path", "dir", "..", "to", "file.ext") === "path/to/file.ext"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
| ...`paths` | (`undefined` \| `string`)[] |
