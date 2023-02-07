[JS Api](../index.md) / EmitContext

# Interface: EmitContext<TOptions\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `TOptions` | extends `object` = `Record`<`string`, `never`\> |

## Table of contents

### Properties

- [emitterOutputDir](EmitContext.md#emitteroutputdir)
- [options](EmitContext.md#options)
- [program](EmitContext.md#program)

### Methods

- [getAssetEmitter](EmitContext.md#getassetemitter)

## Properties

### emitterOutputDir

• **emitterOutputDir**: `string`

Configured output dir for the emitter. Emitter should emit all output under that directory.

___

### options

• **options**: `TOptions`

Emitter custom options defined in createCadlLibrary

___

### program

• **program**: [`Program`](Program.md)

Cadl Program.

## Methods

### getAssetEmitter

▸ **getAssetEmitter**<`T`\>(`TypeEmitterClass`): `AssetEmitter`<`T`\>

Get an asset emitter to write emitted output to disk using a TypeEmitter

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `TypeEmitterClass` | `Object` | The TypeEmitter to construct your emitted output |

#### Returns

`AssetEmitter`<`T`\>
