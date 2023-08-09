---
jsApi: true
title: "[F] $actionSeparator"
---

```ts
$actionSeparator(
  context,
  entity,
  separator): void
```

`@actionSeparator` defines the separator string that is used to precede the action name
in auto-generated actions.

`@actionSeparator` can only be applied to model properties, operation parameters, or operations.

## Parameters

| Parameter   | Type                                      |
| :---------- | :---------------------------------------- |
| `context`   | `DecoratorContext`                        |
| `entity`    | `Model` \| `ModelProperty` \| `Operation` |
| `separator` | `"/"` \| `":"` \| `"/:"`                  |

## Returns

`void`

## Source

[rest.ts:239](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/rest/src/rest.ts#L239)
