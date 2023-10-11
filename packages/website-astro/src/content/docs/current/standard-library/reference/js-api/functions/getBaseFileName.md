---
jsApi: true
title: "[F] getBaseFileName"

---
```ts
getBaseFileName(path): string
```

Returns the path except for its containing directory name.
Semantics align with NodeJS's `path.basename` except that we support URL's as well.

```ts
// POSIX
getBaseFileName("/path/to/file.ext") === "file.ext"
getBaseFileName("/path/to/") === "to"
getBaseFileName("/") === ""
// DOS
getBaseFileName("c:/path/to/file.ext") === "file.ext"
getBaseFileName("c:/path/to/") === "to"
getBaseFileName("c:/") === ""
getBaseFileName("c:") === ""
// URL
getBaseFileName("http://typescriptlang.org/path/to/file.ext") === "file.ext"
getBaseFileName("http://typescriptlang.org/path/to/") === "to"
getBaseFileName("http://typescriptlang.org/") === ""
getBaseFileName("http://typescriptlang.org") === ""
getBaseFileName("file://server/path/to/file.ext") === "file.ext"
getBaseFileName("file://server/path/to/") === "to"
getBaseFileName("file://server/") === ""
getBaseFileName("file://server") === ""
getBaseFileName("file:///path/to/file.ext") === "file.ext"
getBaseFileName("file:///path/to/") === "to"
getBaseFileName("file:///") === ""
getBaseFileName("file://") === ""
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
