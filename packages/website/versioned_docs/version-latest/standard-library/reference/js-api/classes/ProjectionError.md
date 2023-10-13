---
jsApi: true
title: "[C] ProjectionError"

---
Represents a failure while interpreting a projection.

## Extends

- `Error`

## Constructors

### new ProjectionError(message)

```ts
new ProjectionError(message): ProjectionError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |

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
