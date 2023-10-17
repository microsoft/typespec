---
jsApi: true
title: "[C] InvalidEncodingError"

---
## Extends

- `Error`

## Constructors

### new InvalidEncodingError(encoding)

```ts
new InvalidEncodingError(encoding): InvalidEncodingError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `encoding` | `string` |

#### Overrides

Error.constructor

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `message` | `string` | - | Error.message |
| `public` | `name` | `string` | - | Error.name |
| `public` | `stack?` | `string` | - | Error.stack |
| `static` | `prepareStackTrace?` | (`err`, `stackTraces`) => `any` | - | Error.prepareStackTrace |
| `static` | `stackTraceLimit` | `number` | - | Error.stackTraceLimit |

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt`? | `Function` |

#### Inherited from

Error.captureStackTrace
