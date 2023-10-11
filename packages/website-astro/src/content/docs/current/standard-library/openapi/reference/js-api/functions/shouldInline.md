---
jsApi: true
title: "[F] shouldInline"

---
```ts
shouldInline(program, type): boolean
```

Determines whether a type will be inlined in OpenAPI rather than defined
as a schema and referenced.

All anonymous types (anonymous models, arrays, tuples, etc.) are inlined.

Template instantiations are inlined unless they have a friendly name.

A friendly name can be provided by the user using `@friendlyName`
decorator, or chosen by default in simple cases.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
