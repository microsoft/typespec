---
jsApi: true
title: "[T] MarshalledValue"

---
```ts
type MarshalledValue<Type>: Type extends StringLiteral ? string : Type extends NumericLiteral ? number : Type extends BooleanLiteral ? boolean : Type;
```

## Type parameters

| Parameter |
| :------ |
| `Type` |
