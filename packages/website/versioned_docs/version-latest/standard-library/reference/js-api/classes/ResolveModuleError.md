---
jsApi: true
title: "[C] ResolveModuleError"

---
## Extends

- `Error`

## Constructors

### new ResolveModuleError()

```ts
new ResolveModuleError(code, message): ResolveModuleError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `code` | `ResolveModuleErrorCode` |
| `message` | `string` |

#### Returns

[`ResolveModuleError`](ResolveModuleError.md)

#### Overrides

`Error.constructor`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `cause?` | `public` | `unknown` | - | `Error.cause` |
| `code` | `public` | `ResolveModuleErrorCode` | - | - |
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
