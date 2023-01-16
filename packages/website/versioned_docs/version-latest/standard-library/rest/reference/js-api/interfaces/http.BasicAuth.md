[JS Api](../index.md) / [http](../modules/http.md) / BasicAuth

# Interface: BasicAuth

[http](../modules/http.md).BasicAuth

Basic authentication is a simple authentication scheme built into the HTTP protocol.
The client sends HTTP requests with the Authorization header that contains the word Basic word followed by a space and a base64-encoded string username:password.
For example, to authorize as demo / p@55w0rd the client would send
```
 Authorization: Basic ZGVtbzpwQDU1dzByZA==
```

## Hierarchy

- [`HttpAuthBase`](http.HttpAuthBase.md)

  ↳ **`BasicAuth`**

## Table of contents

### Properties

- [description](http.BasicAuth.md#description)
- [id](http.BasicAuth.md#id)
- [scheme](http.BasicAuth.md#scheme)
- [type](http.BasicAuth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[description](http.HttpAuthBase.md#description)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[id](http.HttpAuthBase.md#id)

___

### scheme

• **scheme**: ``"basic"``

___

### type

• **type**: ``"http"``
