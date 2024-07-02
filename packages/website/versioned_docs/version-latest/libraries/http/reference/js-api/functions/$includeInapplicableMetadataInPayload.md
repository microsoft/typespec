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
| :------ | :------ | :------ |
| `context` | `DecoratorContext` | - |
| `entity` | `Type` | <p>Target model, namespace, or model property. If applied to a</p><p>              model or namespace, applies recursively to child models,</p><p>              namespaces, and model properties unless overridden by</p><p>              applying this decorator to a child.</p> |
| `value` | `boolean` | <p>`true` to include inapplicable metadata in payload, false to</p><p>              exclude it.</p> |

## Returns

`void`

## See

isApplicableMetadata
