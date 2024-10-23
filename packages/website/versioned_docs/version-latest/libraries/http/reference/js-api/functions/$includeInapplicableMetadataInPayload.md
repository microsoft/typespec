---
jsApi: true
title: "[F] $includeInapplicableMetadataInPayload"

---
```ts
function $includeInapplicableMetadataInPayload(
   context, 
   entity, 
   value): void
```

Specifies if inapplicable metadata should be included in the payload for
the given entity. This is true by default unless changed by this
decorator.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `entity` | `Type` | Target model, namespace, or model property. If applied to a model or namespace, applies recursively to child models, namespaces, and model properties unless overridden by applying this decorator to a child. |
| `value` | `boolean` | `true` to include inapplicable metadata in payload, false to exclude it. |

## Returns

`void`

## See

isApplicableMetadata
