---
jsApi: true
title: "[F] $externalDocs"
---

```ts
$externalDocs(
  context,
  target,
  url,
  description?): void
```

Allows referencing an external resource for extended documentation.

## Optional

description A short description of the target documentation.

## Parameters

| Parameter      | Type               | Description                                                                 |
| :------------- | :----------------- | :-------------------------------------------------------------------------- |
| `context`      | `DecoratorContext` | -                                                                           |
| `target`       | `Type`             | -                                                                           |
| `url`          | `string`           | The URL for the target documentation. Value MUST be in the format of a URL. |
| `description`? | `string`           | -                                                                           |

## Returns

`void`

## Source

[decorators.ts:111](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/openapi/src/decorators.ts#L111)
