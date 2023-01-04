[Documentation](../index.md) / [http](../modules/http.md) / Oauth2Auth

# Interface: Oauth2Auth<TFlows\>

[http](../modules/http.md).Oauth2Auth

OAuth 2.0 is an authorization protocol that gives an API client limited access to user data on a web server.
OAuth relies on authentication scenarios called flows, which allow the resource owner (user) to share the protected content from the resource server without sharing their credentials.
For that purpose, an OAuth 2.0 server issues access tokens that the client applications can use to access protected resources on behalf of the resource owner.
For more information about OAuth 2.0, see oauth.net and RFC 6749.

## Type parameters

| Name | Type |
| :------ | :------ |
| `TFlows` | extends [`OAuth2Flow`](../modules/http.md#oauth2flow)[] |

## Hierarchy

- [`HttpAuthBase`](http.HttpAuthBase.md)

  ↳ **`Oauth2Auth`**

## Table of contents

### Properties

- [description](http.Oauth2Auth.md#description)
- [flows](http.Oauth2Auth.md#flows)
- [id](http.Oauth2Auth.md#id)
- [type](http.Oauth2Auth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[description](http.HttpAuthBase.md#description)

#### Defined in

[http/types.ts:46](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L46)

___

### flows

• **flows**: `TFlows`

#### Defined in

[http/types.ts:112](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L112)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[id](http.HttpAuthBase.md#id)

#### Defined in

[http/types.ts:41](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L41)

___

### type

• **type**: ``"oauth2"``

#### Defined in

[http/types.ts:111](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L111)
