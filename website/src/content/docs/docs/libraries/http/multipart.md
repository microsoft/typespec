---
title: Multipart requests
---

Multipart requests combine one or more sets of data into a single body, separated by boundaries. This is commonly used to upload files.

To define a multipart request in HTTP you must set the contentType header to `"multipart/form-data"` or `multipart/mixed` as described in the [content types doc](./content-types.md#specify-content-type) and add a multipart body property decorated with `@multipartBody`

```tsp title=main.tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using Http;

op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    username: HttpPart<string>;
    avatar: HttpPart<File>;
  },
): void;
```

Each property of the body represents a part of the multipart request. The name of the property is used as the name of the part. Properties in models are ordered and the order is used to determine the order of the parts in the request.
Each property part must be of type `HttpPart<T>`

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

| Schema Property Type                     | Content-Type               | Example                                                          |
| ---------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| Primitive                                | `text/plain`               | `HttpPart<string>`<br> `HttpPart<number>`<br>`HttpPart<boolean>` |
| Complex value or array of complex values | `application/json`         | `HttpPart<Address>`<br>`HttpPart<Address[]>`                     |
| `File`, `bytes`                          | `application/octet-stream` | `HttpPart<File>`<br>`HttpPart<bytes>`                            |

See [Content types](./content-types.md) for more information about how the HTTP library handles the Content-Type header.

See [Files](./files.md) for more information about how the HTTP library handles file bodies.

## Part names

There is multiple ways to define a part name. The priority is as follows:

1. Explicit name provied in the `HttpPart` options (e.g. `HttpPart<File, #{ name: "avatar" }>`)
2. Model property name (e.g. `name1: HttpPart<string>;`)

```tsp
// Part name here is name2
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    name1: HttpPart<string, #{ name: "name2" }>;
  },
): void;
```

### Unamed parts

When using `multipart/mixed` parts are not required to be named. Instead of passing a model as the multipart body you can pass a tuple with each part

```tsp
model Address {
  street: string;
  city: string;
}
op create(
  @header contentType: "multipart/mixed",
  @multipartBody body: [
    HttpPart<string>,
    HttpPart<File, #{ name: "avatar" }>,  // An name can also be provided this way
    HttpPart<Address>,
    HttpPart<File>[]
  ],
): void;
```

## `HttpPart<Foo>[]` vs `HttpPart<Foo[]>`

- `HttpPart<Foo>[]` Represent multiple parts of type `Foo`
- `HttpPart<Foo[]>` Represent a single part of type `Foo[]`

## Examples

```tsp
// Upload a single file
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    avatar: HttpPart<File>;
  },
): void;

// Upload multiple files
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    avatar: HttpPart<File>;
    banner: HttpPart<File>;
  },
): void;

// Upload many files
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    images: HttpPart<File>[];
  },
): void;

// Upload 2 form fields
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    firstName: HttpPart<string>;
    lastName: HttpPart<string>;
  },
): void;

// Send a json field
model Address {
  street: string;
  city: string;
}
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    address: HttpPart<Address>;
  },
): void;

// Send multiple fields - In this scenario each address is sent as an individual part
model Address {
  street: string;
  city: string;
}
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    addresses: HttpPart<Address>[];
  },
): void;
```

## Custom content type

The first template parameter given to `HttpPart` follow the same logic as a property annotated with `@bodyRoot`. This means you can include headers, implicit body properties or an explicit body inside.

```tsp title=main.tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using Http;

model Png extends File {
  @header contentType: "image/png";
}
op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    avatar: HttpPart<Png>;
    data: HttpPart<{
      name: string;
      @header contentType: "application/xml";
    }>;
  },
): void;
```
