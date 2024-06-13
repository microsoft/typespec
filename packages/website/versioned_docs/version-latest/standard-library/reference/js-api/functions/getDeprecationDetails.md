---
jsApi: true
title: "[F] getDeprecationDetails"

---
```ts
function getDeprecationDetails(program, typeOrNode): DeprecationDetails | undefined
```

Returns complete deprecation details for the given type or node

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `typeOrNode` | [`Type`](../type-aliases/Type.md) \| [`Node`](../type-aliases/Node.md) | A Type or Node to check for deprecation |

## Returns

[`DeprecationDetails`](../interfaces/DeprecationDetails.md) \| `undefined`
