---
jsApi: true
title: "[F] createStateAccessors"

---
```ts
createStateAccessors(
   stateMaps, 
   stateSets, 
   projector?): object
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `stateMaps` | `Map`<`symbol`, `StateMap`\> |
| `stateSets` | `Map`<`symbol`, `StateSet`\> |
| `projector`? | [`Projector`](../interfaces/Projector.md) |

## Returns

> | Member | Type | Description |
> | :------ | :------ | :------ |
> | `stateMap` | <`T`\>(`key`) => `StateMapView`<`T`\> | - |
> | `stateSet` | (`key`) => `StateSetView` | - |
>
