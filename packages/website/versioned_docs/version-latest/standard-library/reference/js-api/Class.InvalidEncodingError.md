---
jsApi: true
title: "[C] InvalidEncodingError"

---
## Extends

- `Error`

## Constructors

### new InvalidEncodingError

```ts
new InvalidEncodingError(encoding): InvalidEncodingError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `encoding` | `string` |

#### Returns

[`InvalidEncodingError`](Class.InvalidEncodingError.md)

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
