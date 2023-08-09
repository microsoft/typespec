---
jsApi: true
title: "[V] PROTO_FULL_IDENT"
---

```ts
const PROTO_FULL_IDENT: RegExp;
```

Defined in the [ProtoBuf Language Spec](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec#identifiers).

ident = letter { letter | decimalDigit | "\_" }
fullIdent = ident { "." ident }

## Source

[proto.ts:48](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/protobuf/src/proto.ts#L48)
