---
jsApi: true
title: "[T] MarshalledValue"

---
```ts
type MarshalledValue<Value>: Value extends StringValue ? string : Value extends NumericValue ? number | Numeric : Value extends BooleanValue ? boolean : Value extends ObjectValue ? Record<string, unknown> : Value extends ArrayValue ? unknown[] : Value extends EnumValue ? EnumMember : Value extends NullValue ? null : Value extends ScalarValue ? Value : Value;
```

## Type parameters

| Type parameter |
| :------ |
| `Value` |
