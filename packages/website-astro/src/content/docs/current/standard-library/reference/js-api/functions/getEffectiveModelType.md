---
jsApi: true
title: "[F] getEffectiveModelType"

---
```ts
getEffectiveModelType(
   program, 
   model, 
   filter?): Model
```

If the input is anonymous (or the provided filter removes properties)
and there exists a named model with the same set of properties
(ignoring filtered properties), then return that named model.
Otherwise, return the input unchanged.

This can be used by emitters to find a better name for a set of
properties after filtering. For example, given `{ @metadata prop:
string} & SomeName`, and an emitter that wishes to discard properties
marked with `@metadata`, the emitter can use this to recover that the
best name for the remaining properties is `SomeName`.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | - |
| `model` | [`Model`](../interfaces/Model.md) | The input model |
| `filter`? | (`property`) => `boolean` | An optional filter to apply to the input model's<br />properties. |
