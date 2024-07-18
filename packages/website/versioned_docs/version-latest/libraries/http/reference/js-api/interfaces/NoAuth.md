---
jsApi: true
title: "[I] NoAuth"

---
This authentication option signifies that API is not secured at all.
It might be useful when overriding authentication on interface of operation level.

## Extends

- [`HttpAuthBase`](HttpAuthBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `description?` | `public` | `string` | Optional description. | [`HttpAuthBase`](HttpAuthBase.md).`description` |
| `id` | `public` | `string` | Id of the authentication scheme. | [`HttpAuthBase`](HttpAuthBase.md).`id` |
| `model` | `readonly` | `Model` | Model that defined the authentication | [`HttpAuthBase`](HttpAuthBase.md).`model` |
| `type` | `public` | `"noAuth"` | - | - |
