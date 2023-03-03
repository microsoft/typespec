[JS Api](../index.md) / DecoratorContext

# Interface: DecoratorContext

## Table of contents

### Properties

- [decoratorTarget](DecoratorContext.md#decoratortarget)
- [program](DecoratorContext.md#program)

### Methods

- [call](DecoratorContext.md#call)
- [getArgumentTarget](DecoratorContext.md#getargumenttarget)

## Properties

### decoratorTarget

• **decoratorTarget**: [`DiagnosticTarget`](../index.md#diagnostictarget)

Point to the decorator target

___

### program

• **program**: [`Program`](Program.md)

## Methods

### call

▸ **call**<`T`, `A`, `R`\>(`decorator`, `target`, `...args`): `R`

Helper to call out to another decorator

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Type`](../index.md#type) |
| `A` | extends `any`[] |
| `R` | `R` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `decorator` | (`context`: [`DecoratorContext`](DecoratorContext.md), `target`: `T`, ...`args`: `A`) => `R` | Other decorator function |
| `target` | `T` | - |
| `...args` | `A` | Args to pass to other decorator function |

#### Returns

`R`

___

### getArgumentTarget

▸ **getArgumentTarget**(`paramIndex`): `undefined` \| [`DiagnosticTarget`](../index.md#diagnostictarget)

Function that can be used to retrieve the target for a parameter at the given index.

**`Example`**

```ts
@foo("bar", 123) -> $foo(context, target, arg0: string, arg1: number);
 getArgumentTarget(0) -> target for arg0
 getArgumentTarget(1) -> target for arg1
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `paramIndex` | `number` | Parameter index in the typespec |

#### Returns

`undefined` \| [`DiagnosticTarget`](../index.md#diagnostictarget)
