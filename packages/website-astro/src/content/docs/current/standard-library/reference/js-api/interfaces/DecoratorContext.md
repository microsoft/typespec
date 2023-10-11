---
jsApi: true
title: "[I] DecoratorContext"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decoratorTarget` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) | Point to the decorator target |
| `program` | [`Program`](Program.md) | - |

## Methods

### call()

```ts
call<T, A, R>(
   decorator, 
   target, ...
   args): R
```

Helper to call out to another decorator

#### Type parameters

| Parameter |
| :------ |
| `T` extends [`Type`](../type-aliases/Type.md) |
| `A` extends `any`[] |
| `R` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `decorator` | (`context`, `target`, ...`args`) => `R` | Other decorator function |
| `target` | `T` | - |
| ...`args` | `A` | Args to pass to other decorator function |

***

### getArgumentTarget()

```ts
getArgumentTarget(paramIndex): undefined | DiagnosticTarget
```

Function that can be used to retrieve the target for a parameter at the given index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `paramIndex` | `number` | Parameter index in the typespec |

#### Returns

#### Example

```ts
@foo("bar", 123) -> $foo(context, target, arg0: string, arg1: number);
 getArgumentTarget(0) -> target for arg0
 getArgumentTarget(1) -> target for arg1
```
