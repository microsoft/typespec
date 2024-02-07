---
jsApi: true
title: "[I] OpenIDConnectAuth"

---
OpenID Connect (OIDC) is an identity layer built on top of the OAuth 2.0 protocol and supported by some OAuth 2.0 providers, such as Google and Azure Active Directory.
It defines a sign-in flow that enables a client application to authenticate a user, and to obtain information (or "claims") about that user, such as the user name, email, and so on.
User identity information is encoded in a secure JSON Web Token (JWT), called ID token.
OpenID Connect defines a discovery mechanism, called OpenID Connect Discovery, where an OpenID server publishes its metadata at a well-known URL, typically

```http
https://server.com/.well-known/openid-configuration
```

## Extends

- [`HttpAuthBase`](HttpAuthBase.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `description?` | `string` | Optional description. | [`HttpAuthBase.description`](HttpAuthBase.md) |
| `id` | `string` | Id of the authentication scheme. | [`HttpAuthBase.id`](HttpAuthBase.md) |
| `openIdConnectUrl` | `string` | - | - |
| `type` | `"openIdConnect"` | - | - |
