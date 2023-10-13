---
jsApi: true
title: "[F] reportDiagnostic"

---
```ts
reportDiagnostic<C, M>(program, diag): void
```

## Type parameters

| Parameter |
| :------ |
| `C` *extends* `"invalid-identifier"` \| `"missing-type-parent"` \| `"no-numeric"` \| `"unrecognized-scalar"` |
| `M` *extends* `string` \| `number` \| `symbol` |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `diag` | `DiagnosticReport`< `Object`, `C`, `M` \> |

## Returns

`void`
