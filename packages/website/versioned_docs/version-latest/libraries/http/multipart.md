---
title: Multipart requests
---

Multipart requests combine one or more sets of data into a single body, separated by boundaries. This is commonly used to upload files.

To define a multipart request in HTTP you must set the contentType header to `"multipart/form-data"` as described in the [content types doc](./content-types.md#specify-content-type)

```tsp
op create(@header contentType: "multipart/form-data", username: string, avatar: bytes): void;
```

Each property of the body represents a part of the multipart request. The name of the property is used as the name of the part. Properties in models are ordered and the order is used to determine the order of the parts in the request.

The previous example would correspond to the following HTTP request:

```http
POST / HTTP/1.1
Content-Length: 428
Content-Type: multipart/form-data; boundary=abcde12345
--abcde12345
Content-Disposition: form-data; name="username"
Content-Type: text/plain
typespector
--abcde12345
Content-Disposition: form-data; name="avatar"; filename="image1.png"
Content-Type: application/octet-stream
{…file content…}
--abcde12345--
```

## Default handling

By default, the `Content-Type` of individual request parts is set automatically according to the type of the schema properties that describe the request parts:

| Schema Property Type                     | Content-Type               | Example                       |
| ---------------------------------------- | -------------------------- | ----------------------------- |
| Primitive                                | `text/plain`               | `string`, `number`, `boolean` |
| Complex value or array of complex values | `application/json`         | `Address`, `Address[]`        |
| `bytes`                                  | `application/octet-stream` | `bytes`                       |

## Examples

```tsp
// Upload a single file
op create(@header contentType: "multipart/form-data", avatar: bytes): void;

// Upload multiple files
op create(@header contentType: "multipart/form-data", avatar: bytes, banner: bytes): void;

// Upload many files
op create(@header contentType: "multipart/form-data", images: bytes[]): void;

// Upload 2 form fields
op create(@header contentType: "multipart/form-data", firstName: string, lastName: string): void;

// Send a json field
model Address {
  street: string;
  city: string;
}
op create(@header contentType: "multipart/form-data", address: Address): void;

// Send multiple fields - In this scenario each address is sent as an individual part
model Address {
  street: string;
  city: string;
}
op create(@header contentType: "multipart/form-data", addresses: Address[]): void;
```

## Custom Content-Type, boundary, etc.

This is currently not possible, see [Issue 2419](https://github.com/microsoft/typespec/issues/2419) for status.
