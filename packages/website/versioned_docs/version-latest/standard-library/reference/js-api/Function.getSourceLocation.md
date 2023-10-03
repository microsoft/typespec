---
jsApi: true
title: "[F] getSourceLocation"

---
```ts
getSourceLocation(target, options?): SourceLocation
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) |
| `options`? | [`SourceLocationOptions`](Interface.SourceLocationOptions.md) |

## Returns

[`SourceLocation`](Interface.SourceLocation.md)

```ts
getSourceLocation(target, options?): undefined
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | `undefined` \| *typeof* [`NoTarget`](Variable.NoTarget.md) |
| `options`? | [`SourceLocationOptions`](Interface.SourceLocationOptions.md) |

## Returns

`undefined`

```ts
getSourceLocation(target, options?): SourceLocation | undefined
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | `undefined` \| [`DiagnosticTarget`](Type.DiagnosticTarget.md) \| *typeof* [`NoTarget`](Variable.NoTarget.md) |
| `options`? | [`SourceLocationOptions`](Interface.SourceLocationOptions.md) |

## Returns

[`SourceLocation`](Interface.SourceLocation.md) \| `undefined`
