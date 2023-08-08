---
jsApi: true
title: "[F] checkDuplicateTypeName"
---

```ts
checkDuplicateTypeName(
  program,
  type,
  name,
  existing): void
```

## Parameters

| Parameter  | Type                                            |
| :--------- | :---------------------------------------------- |
| `program`  | `Program`                                       |
| `type`     | `Type`                                          |
| `name`     | `string`                                        |
| `existing` | `undefined` \| `Record`< `string`, `unknown` \> |

## Returns

`void`

## Source

[helpers.ts:67](https://github.com/markcowl/cadl/blob/3db15286/packages/openapi/src/helpers.ts#L67)
