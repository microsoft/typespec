---
jsApi: true
title: "[F] getAnyExtensionFromPath"

---
```ts
function getAnyExtensionFromPath(path): string
```

Gets the file extension for a path.
Normalizes it to lower case.

```ts
getAnyExtensionFromPath("/path/to/file.ext") === ".ext"
getAnyExtensionFromPath("/path/to/file.ext/") === ".ext"
getAnyExtensionFromPath("/path/to/file") === ""
getAnyExtensionFromPath("/path/to.ext/file") === ""
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

## Returns

`string`
