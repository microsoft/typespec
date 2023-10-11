---
jsApi: true
title: "[F] getNormalizedPathComponents"

---
```ts
getNormalizedPathComponents(path, currentDirectory): string[]
```

Parse a path into an array containing a root component (at index 0) and zero or more path
components (at indices > 0). The result is normalized.
If the path is relative, the root component is `""`.
If the path is absolute, the root component includes the first path separator (`/`).

```ts
getNormalizedPathComponents("to/dir/../file.ext", "/path/") === ["/", "path", "to", "file.ext"]
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
| `currentDirectory` | `undefined` \| `string` |
