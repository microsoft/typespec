---
jsApi: true
title: "[F] $includeInapplicableMetadataInPayload"

---
```ts
$includeInapplicableMetadataInPayload(
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
| `entity` | `Type` | Target model, namespace, or model property. If applied to a<br />              model or namespace, applies recursively to child models,<br />              namespaces, and model properties unless overridden by<br />              applying this decorator to a child. |
| `value` | `boolean` | `true` to include inapplicable metadata in payload, false to<br />              exclude it. |

## Returns

## See

isApplicableMetadata
