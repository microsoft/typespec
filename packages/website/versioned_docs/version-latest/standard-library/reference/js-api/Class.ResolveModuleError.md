---
jsApi: true
title: "[C] ResolveModuleError"

---
## Extends

- `Error`

## Constructors

### new ResolveModuleError

```ts
new ResolveModuleError(code, message): ResolveModuleError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `code` | `ResolveModuleErrorCode` |
| `message` | `string` |

#### Returns

[`ResolveModuleError`](Class.ResolveModuleError.md)

#### Overrides

Error.constructor

## Properties

| Property | Type |
| :------ | :------ |
| `code` | `ResolveModuleErrorCode` |
| `message` | `string` |
| `name` | `string` |
| `stack`? | `string` |
| `prepareStackTrace`? | (`err`, `stackTraces`) => `any` |
| `static` `stackTraceLimit` | `number` |

## Methods

### captureStackTrace

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt`? | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
