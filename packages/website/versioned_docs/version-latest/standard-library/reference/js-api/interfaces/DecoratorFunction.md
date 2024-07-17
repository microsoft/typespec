---
jsApi: true
title: "[I] DecoratorFunction"

---
```ts
interface DecoratorFunction(
   program, 
   target, ...
   customArgs): void
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `program` | [`DecoratorContext`](DecoratorContext.md) |
| `target` | `any` |
| ...`customArgs` | `any`[] |

## Returns

`void`

## Properties

| Property | Type |
| ------ | ------ |
| `namespace?` | `string` |
