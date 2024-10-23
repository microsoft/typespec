---
jsApi: true
title: "[I] HttpAuthBase"

---
## Extended by

- [`BasicAuth`](BasicAuth.md)
- [`BearerAuth`](BearerAuth.md)
- [`ApiKeyAuth`](ApiKeyAuth.md)
- [`Oauth2Auth`](Oauth2Auth.md)
- [`OpenIDConnectAuth`](OpenIDConnectAuth.md)
- [`NoAuth`](NoAuth.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `description?` | `public` | `string` | Optional description. |
| `id` | `public` | `string` | Id of the authentication scheme. |
| `model` | `readonly` | `Model` | Model that defined the authentication |
