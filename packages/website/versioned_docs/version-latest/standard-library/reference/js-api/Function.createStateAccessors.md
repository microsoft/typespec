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
| `stateMaps` | `Map`< `symbol`, `StateMap` \> |
| `stateSets` | `Map`< `symbol`, `StateSet` \> |
| `projector`? | [`Projector`](Interface.Projector.md) |

## Returns

| Member | Type |
| :------ | :------ |
| `stateMap` | <`T`>(`key`) => `StateMapView`< `T` \> |
| `stateSet` | (`key`) => `StateSetView` |
