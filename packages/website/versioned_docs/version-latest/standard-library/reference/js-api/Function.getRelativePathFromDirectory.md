---
jsApi: true
title: "[F] getRelativePathFromDirectory"

---
```ts
getRelativePathFromDirectory(
  from,
  to,
  ignoreCase): string
```

Gets a relative path that can be used to traverse between `from` and `to`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `from` | `string` |
| `to` | `string` |
| `ignoreCase` | `boolean` |

## Returns

`string`

```ts
getRelativePathFromDirectory(
  fromDirectory,
  to,
  getCanonicalFileName): string
```

Gets a relative path that can be used to traverse between `from` and `to`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `fromDirectory` | `string` |
| `to` | `string` |
| `getCanonicalFileName` | `GetCanonicalFileName` |

## Returns

`string`
