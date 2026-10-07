---
changeKind: feature
packages:
  - "@typespec/protobuf"
---

Support `oneof` from named unions. `@field` can now be applied to union variants. An optional property of a named union type without `@field` is emitted inline as a `oneof` that shares the containing message's field indices; a property with `@field` refers to a wrapper message containing a `oneof value`.

```tsp
union Payment {
  @field(10) card: CardPayment,
  @field(11) bank_transfer: BankTransfer,
}

model Order {
  @field(1) id: string;
  payment?: Payment; // oneof payment { CardPayment card = 10; BankTransfer bank_transfer = 11; }
}
```
