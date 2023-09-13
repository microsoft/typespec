---
jsApi: true
title: "[F] getDeprecationDetails"

---
```ts
getDeprecationDetails(program, typeOrNode): DeprecationDetails | undefined
```

Returns complete deprecation details for the given type or node

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | Program |
| `typeOrNode` | [`Node`](Type.Node.md) \| [`Type`](Type.Type.md) | A Type or Node to check for deprecation |

## Returns

[`DeprecationDetails`](Interface.DeprecationDetails.md) \| `undefined`
