---
jsApi: true
title: "[F] removeTrailingDirectorySeparator"

---
```ts
removeTrailingDirectorySeparator(path): string
```

Removes a trailing directory separator from a path, if it does not already have one.

```ts
removeTrailingDirectorySeparator("/path/to/file.ext") === "/path/to/file.ext"
removeTrailingDirectorySeparator("/path/to/file.ext/") === "/path/to/file.ext"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
