---
jsApi: true
title: "[C] ResolveModuleError"

---
## Extends

- `Error`

## Constructors

### new ResolveModuleError(code, message)

```ts
new ResolveModuleError(code, message): ResolveModuleError
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `code` | `ResolveModuleErrorCode` |
| `message` | `string` |

#### Overrides

Error.constructor

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `code` | `ResolveModuleErrorCode` | - | - |
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
