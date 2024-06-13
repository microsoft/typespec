---
jsApi: true
title: "[C] ProjectionError"

---
Represents a failure while interpreting a projection.

## Extends

- `Error`

## Constructors

### new ProjectionError()

```ts
new ProjectionError(message): ProjectionError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

[`ProjectionError`](ProjectionError.md)

#### Overrides

`Error.constructor`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `cause?` | `public` | `unknown` | - | `Error.cause` |
| `message` | `public` | `string` | - | `Error.message` |
| `name` | `public` | `string` | - | `Error.name` |
| `stack?` | `public` | `string` | - | `Error.stack` |
| `prepareStackTrace?` | `static` | (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any` | <p>Optional override for formatting stack traces</p><p>**See**</p><p>https://v8.dev/docs/stack-trace-api#customizing-stack-traces</p> | `Error.prepareStackTrace` |
| `stackTraceLimit` | `static` | `number` | - | `Error.stackTraceLimit` |

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

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`
