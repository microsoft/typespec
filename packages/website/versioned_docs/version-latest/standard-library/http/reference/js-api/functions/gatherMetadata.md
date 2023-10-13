---
jsApi: true
title: "[F] gatherMetadata"

---
```ts
gatherMetadata(
   program, 
   diagnostics, 
   type, 
   visibility, 
   isMetadataCallback, 
rootMapOut?): Set<ModelProperty>
```

Walks the given type and collects all applicable metadata and `@body`
properties recursively.

## Parameters

| Parameter | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `program` | `Program` | `undefined` | - |
| `diagnostics` | `DiagnosticCollector` | `undefined` | - |
| `type` | `Type` | `undefined` | - |
| `visibility` | [`Visibility`](../enumerations/Visibility.md) | `undefined` | - |
| `isMetadataCallback` | (`program`, `property`) => `boolean` | `isMetadata` | - |
| `rootMapOut`? | `Map`<`ModelProperty`, `ModelProperty`\> | `undefined` | If provided, the map will be populated to link<br />nested metadata properties to their root properties. |
