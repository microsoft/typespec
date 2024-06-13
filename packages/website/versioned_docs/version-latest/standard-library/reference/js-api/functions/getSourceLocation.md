---
jsApi: true
title: "[F] getSourceLocation"

---
## getSourceLocation(target, options)

```ts
function getSourceLocation(target, options?): SourceLocation
```

### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) |
| `options`? | [`SourceLocationOptions`](../interfaces/SourceLocationOptions.md) |

### Returns

[`SourceLocation`](../interfaces/SourceLocation.md)

## getSourceLocation(target, options)

```ts
function getSourceLocation(target, options?): undefined
```

### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | `undefined` \| *typeof* [`NoTarget`](../variables/NoTarget.md) |
| `options`? | [`SourceLocationOptions`](../interfaces/SourceLocationOptions.md) |

### Returns

`undefined`

## getSourceLocation(target, options)

```ts
function getSourceLocation(target, options?): SourceLocation | undefined
```

### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | `undefined` \| [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) \| *typeof* [`NoTarget`](../variables/NoTarget.md) |
| `options`? | [`SourceLocationOptions`](../interfaces/SourceLocationOptions.md) |

### Returns

[`SourceLocation`](../interfaces/SourceLocation.md) \| `undefined`
