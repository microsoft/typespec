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
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `typeOrNode` | [`Node`](../type-aliases/Node.md) \| [`Type`](../type-aliases/Type.md) | A Type or Node to check for deprecation |
