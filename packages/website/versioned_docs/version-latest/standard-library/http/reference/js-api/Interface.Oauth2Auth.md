---
jsApi: true
title: "[I] Oauth2Auth"

---
OAuth 2.0 is an authorization protocol that gives an API client limited access to user data on a web server.
OAuth relies on authentication scenarios called flows, which allow the resource owner (user) to share the protected content from the resource server without sharing their credentials.
For that purpose, an OAuth 2.0 server issues access tokens that the client applications can use to access protected resources on behalf of the resource owner.
For more information about OAuth 2.0, see oauth.net and RFC 6749.

## Extends

- [`HttpAuthBase`](Interface.HttpAuthBase.md)

## Type parameters

| Parameter |
| :------ |
| `TFlows` *extends* [`OAuth2Flow`](Type.OAuth2Flow.md)[] |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description`? | `string` | Optional description. |
| `flows` | `TFlows` | - |
| `id` | `string` | Id of the authentication scheme. |
| `type` | `"oauth2"` | - |
