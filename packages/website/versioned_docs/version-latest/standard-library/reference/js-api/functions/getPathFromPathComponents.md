---
jsApi: true
title: "[F] getPathFromPathComponents"

---
```ts
function getPathFromPathComponents(pathComponents): string
```

Formats a parsed path consisting of a root component (at index 0) and zero or more path
segments (at indices > 0).

```ts
getPathFromPathComponents(["/", "path", "to", "file.ext"]) === "/path/to/file.ext"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `pathComponents` | readonly `string`[] |

## Returns

`string`
