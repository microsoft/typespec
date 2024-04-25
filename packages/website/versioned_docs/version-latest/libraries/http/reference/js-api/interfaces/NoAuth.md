---
jsApi: true
title: "[I] NoAuth"

---
This authentication option signifies that API is not secured at all.
It might be useful when overriding authentication on interface of operation level.

## Extends

- [`HttpAuthBase`](HttpAuthBase.md)

## Properties

| Property | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ |
| `description?` | `string` | Optional description. | [`HttpAuthBase`](HttpAuthBase.md).`description` |
| `id` | `string` | Id of the authentication scheme. | [`HttpAuthBase`](HttpAuthBase.md).`id` |
| `type` | `"noAuth"` | - | - |
