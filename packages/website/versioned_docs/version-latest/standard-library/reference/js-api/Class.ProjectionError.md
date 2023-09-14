---
jsApi: true
title: "[C] ProjectionError"

---
Represents a failure while interpreting a projection.

## Extends

- `Error`

## Constructors

### new ProjectionError

```ts
new ProjectionError(message): ProjectionError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

[`ProjectionError`](Class.ProjectionError.md)

#### Overrides

Error.constructor

## Properties

| Property | Type |
| :------ | :------ |
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
