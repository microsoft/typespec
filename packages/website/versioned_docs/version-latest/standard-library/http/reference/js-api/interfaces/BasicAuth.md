[JS Api](../index.md) / BasicAuth

# Interface: BasicAuth

Basic authentication is a simple authentication scheme built into the HTTP protocol.
The client sends HTTP requests with the Authorization header that contains the word Basic word followed by a space and a base64-encoded string username:password.
For example, to authorize as demo / p@55w0rd the client would send
```
 Authorization: Basic ZGVtbzpwQDU1dzByZA==
```

## Hierarchy

- [`HttpAuthBase`](HttpAuthBase.md)

  ↳ **`BasicAuth`**

## Table of contents

### Properties

- [description](BasicAuth.md#description)
- [id](BasicAuth.md#id)
- [scheme](BasicAuth.md#scheme)
- [type](BasicAuth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[description](HttpAuthBase.md#description)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[id](HttpAuthBase.md#id)

___

### scheme

• **scheme**: ``"basic"``

___

### type

• **type**: ``"http"``
