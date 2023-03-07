[JS Api](../index.md) / Oauth2Auth

# Interface: Oauth2Auth<TFlows\>

OAuth 2.0 is an authorization protocol that gives an API client limited access to user data on a web server.
OAuth relies on authentication scenarios called flows, which allow the resource owner (user) to share the protected content from the resource server without sharing their credentials.
For that purpose, an OAuth 2.0 server issues access tokens that the client applications can use to access protected resources on behalf of the resource owner.
For more information about OAuth 2.0, see oauth.net and RFC 6749.

## Type parameters

| Name | Type |
| :------ | :------ |
| `TFlows` | extends [`OAuth2Flow`](../index.md#oauth2flow)[] |

## Hierarchy

- [`HttpAuthBase`](HttpAuthBase.md)

  ↳ **`Oauth2Auth`**

## Table of contents

### Properties

- [description](Oauth2Auth.md#description)
- [flows](Oauth2Auth.md#flows)
- [id](Oauth2Auth.md#id)
- [type](Oauth2Auth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[description](HttpAuthBase.md#description)

___

### flows

• **flows**: `TFlows`

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[id](HttpAuthBase.md#id)

___

### type

• **type**: ``"oauth2"``
