---
title: Content types
---

## Default behavior

Content type is assumed to be `application/json` by default regardless of the type of the request or response body.

**Examples:**

```typespec
op download(): bytes; // Returns a json string with the bytes serialized as a base64.
op getContent(): string; // Returns a json string
op getPet(): {
  // Json object with a name property.
  name: string;
};
```

## Specify content type

The content type for an operation can be specified by including a header parameter named `contentType`.

#### Request content type

```typespec
op uploadImage(@header contentType: "image/png", @body image: bytes): void;
```

#### Response content type:

```typespec
op downloadImage(): {
  @header contentType: "image/png";
  @body image: bytes;
};
```

#### Multiple content types

If there is multiples content types for the same body, they can be specified using a union of string.

```typespec
op uploadImage(@header contentType: "image/png" | "image/jpeg", @body image: bytes): void;
```

## Content type negotiation

There could be cases where you might the same endpoint to return different content depending on the content type requested. This can be achieved in 2 ways:

- using shared routes where different content response is represented as a different operation that share the same endpoint
- using overloads where each different content response is an overload.

For example assuming there is an api that lets you download the avatar as a `png` or `jpeg` which is decided by what `Accept` header is sent.

### Option 1: Using shared route

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
