---
jsApi: true
title: "[I] EmitContext"

---
## Type parameters

| Parameter | Default |
| :------ | :------ |
| `TOptions` extends `object` | `Record`<`string`, `never`\> |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `emitterOutputDir` | `string` | Configured output dir for the emitter. Emitter should emit all output under that directory. |
| `options` | `TOptions` | Emitter custom options defined in createTypeSpecLibrary |
| `program` | [`Program`](Program.md) | TypeSpec Program. |

## Methods

### getAssetEmitter()

```ts
getAssetEmitter<T>(TypeEmitterClass): AssetEmitter<T, TOptions>
```

Get an asset emitter to write emitted output to disk using a TypeEmitter

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `TypeEmitterClass` | *typeof* `TypeEmitter` | The TypeEmitter to construct your emitted output |
