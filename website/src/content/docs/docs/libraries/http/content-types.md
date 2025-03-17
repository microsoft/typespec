---
title: Content types
---

## Default behavior

By default, if the content-type is not explicitly specified, the HTTP library will use the [`@mediaTypeHint`](../../standard-library/built-in-decorators.md#mediatypehint-mediatypehint) of the body type. For built-in TypeSpec types, the default content-type values are:

- `"application/json"` if the body is a Model or a union that contains `null`.
- `"application/octet-stream"` if the body is `TypeSpec.bytes` or a scalar that extends it (unless that scalar provides its own `@mediaTypeHint`).
- `"text/plain"` if the body is any other scalar type that does not have a `@mediaTypeHint`.

**Examples:**

```typespec
// Returns an application/octet-stream binary body
op download(): bytes;

// Returns a text/plain string
op getContent(): string;

// Returns an application/json body that is either a string or the `null` value
op getContentNullable(): string | null;

// Returns an application/json body with a `name` property.
op getPet(): {
  name: string;
};
```

The same logic applies to requests and response bodies, and it uses the precise type of the body if `@body` or `@bodyRoot` are used.

## Specifying Content-Type

You can specify the content type for an operation by including a header parameter named `contentType`.

### Request Content-Type

```typespec
op uploadImage(@header contentType: "image/png", @body image: bytes): void;
```

### Response Content-Type

```typespec
op downloadImage(): {
  @header contentType: "image/png";
  @body image: bytes;
};
```

### Multiple Content-Type values

If there are multiple content types for the same body, you can specify them as a union of strings.

```typespec
op uploadImage(@header contentType: "image/png" | "image/jpeg", @body image: bytes): void;
```

## Content-Type negotiation

In some cases, the same endpoint might return different content depending on the requested content type. This can be achieved in two ways:

- Using shared routes where different content responses are represented as different operations that share the same endpoint.
- Using overloads where each different content response is an overload.

For example, an API that lets you download an avatar as either `png` or `jpeg` based on the `Accept` header.

### Option 1: Using a shared route

```tsp
model PngImage {
  @header contentType: "image/png";
  @body image: bytes;
}

model JpegImage {
  @header contentType: "image/jpeg";
  @body image: bytes;
}

@route("/avatar")
@sharedRoute
op getAvatarAsPng(@header accept: "image/png"): PngImage;

@route("/avatar")
@sharedRoute
op getAvatarAsJpeg(@header accept: "image/jpeg"): JpegImage;
```

### Option 2: Using overload

```tsp
model PngImage {
  @header contentType: "image/png";
  @body image: bytes;
}

model JpegImage {
  @header contentType: "image/jpeg";
  @body image: bytes;
}

@route("/avatar")
op getAvatar(@header accept: "image/png" | "image/jpeg"): PngImage | JpegImage;

@overload(getAvatar)
op getAvatarAsPng(@header accept: "image/png"): PngImage;

@overload(getAvatar)
op getAvatarAsJpeg(@header accept: "image/jpeg"): JpegImage;
```

## Multipart request

See [the documentation of multipart requests and responses for more information](./multipart.md).
