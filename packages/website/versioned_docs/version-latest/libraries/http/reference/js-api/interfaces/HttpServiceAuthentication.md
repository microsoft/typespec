---
jsApi: true
title: "[I] HttpServiceAuthentication"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `defaultAuth` | `readonly` | [`AuthenticationReference`](AuthenticationReference.md) | Default authentication for operations in this service. |
| `operationsAuth` | `readonly` | `Map`<`Operation`, [`AuthenticationReference`](AuthenticationReference.md)\> | Authentication overrides for individual operations. |
| `schemes` | `readonly` | [`HttpAuth`](../type-aliases/HttpAuth.md)[] | All the authentication schemes used in this service. Some might only be used in certain operations. |
