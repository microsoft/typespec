---
jsApi: true
title: "[F] filterModelProperties"

---
```ts
filterModelProperties(
  program,
  model,
  filter): Model
```

Applies a filter to the properties of a given type. If no properties
are filtered out, then return the input unchanged. Otherwise, return
a new anonymous model with only the filtered properties.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) \| [`ProjectedProgram`](Interface.ProjectedProgram.md) | - |
| `model` | [`Model`](Interface.Model.md) | The input model to filter. |
| `filter` | (`property`) => `boolean` | The filter to apply. Properties are kept when this returns true. |

## Returns

[`Model`](Interface.Model.md)
