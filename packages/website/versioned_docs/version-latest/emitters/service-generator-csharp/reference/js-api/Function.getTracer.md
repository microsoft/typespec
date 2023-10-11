---
jsApi: true
title: "[F] getTracer"

---
```ts
getTracer(program): Tracer
```

Returns a tracer scopped to the current library.
All trace area logged via this tracer will be prefixed with the library name.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |

## Returns

`Tracer`
