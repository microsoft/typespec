---
jsApi: true
title: "[F] isReadonlyProperty"

---
```ts
isReadonlyProperty(program, property): boolean
```

Determines if a property is read-only, which is defined as being
decorated `@visibility("read")`.

If there is more than 1 `@visibility` argument, then the property is not
read-only. For example, `@visibility("read", "update")` does not
designate a read-only property.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `property` | `ModelProperty` |
