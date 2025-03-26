---
title: Files
---

## About `Http.File`

`@typespec/http` provides a special model, [`TypeSpec.Http.File`][typespec-http-file], that represents the concept of a file. The HTTP library has special behavior when a request, response, or multipart part body is-or-extends `TypeSpec.Http.File`.

```typespec
using TypeSpec.Http;

op exampleDownload(): File;
```

If `File` were any other ordinary model, the above operation would be interpreted as returning a structured JSON data object that represents the fields of the model. `File`, however, has special semantics. The HTTP library understands that an operation that returns a `File` or any model that extends `File` has the semantics of downloading a file with binary payload and arbitrary content-type from the server. We call these cases "file bodies" to distinguish them from ordinary bodies.

`Http.File` has three properties that are understood to have special meaning when a request, response, or multipart payload has a file body.

- `contents`: the contents of the file, which are the body of the request, response, or multipart payload. This location cannot be changed by subtypes of `Http.File`.
- `contentType`: (optional) the media (MIME) type of the file, which is sent in the `Content-Type` header of the request, response, or multipart payload. This location cannot be changed by subtypes of `Http.File`.
- `filename`: (optional) the name of the file, which is sent in the `filename` parameter of the `Content-Disposition` header of response and multipart payloads. By default, it cannot be sent in requests, as `Content-Disposition` is only valid for response and multipart payloads. This location _can_ be changed by subtypes of `Http.File` that apply HTTP metadata to the location. See [_Overriding the `filename` location_](#overriding-the-filename-location) below for more information.

## Using `Http.File` in operations

An operation payload (request, response, or multipart part) has a file body if:

- The type of the body is _effectively_ a model that is or extends `Http.File` **AND**
- there is no explicit declaration of a `Content-Type` header (see [_`File` with an explicit `Content-Type` header_ below for reasoning and more information](#file-with-an-explicit-content-type-header)).

By "effectively a model that is or extends `Http.File`," we mean cases where an explicit body property is provided and its type is or extends `Http.File` as well as cases where `Http.File` alone is spread into a request or response payload. The following sections contain examples of using `Http.File` in various contexts to define operations that have file bodies.

### Downloading a file

All of the following TypeSpec operation definitions have file bodies in the response:

```typespec
// The response is _exactly_ a File, so the response has a file body.
op download(): File;

// The response has an explicit body that is a File, so the response has a file body.
op download(): {
  @bodyRoot file: File;
};

// The response is _effectively_ a File (`File` is the only thing spread into it), so the response has a file body.
op download(): {
  ...File;
};

// The response has an explicit body that is _effectively_ a File, so the response has a file body.
op download(): {
  @bodyRoot file: {
    ...File;
  };
};
```

### Uploading a file

All of the following TypeSpec operation definitions have file bodies in the request:

```typespec
// The request has an explicit body that is _exactly_ a File, so the request has a file body.
op upload(@bodyRoot file: File): void;

// The request is _effectively_ a File (`File` is the only thing spread into it), so the request has a file body.
op upload(...File): void;

// The request has an explicit body that is _effectively_ a File, so the request has a file body.
op upload(
  @bodyRoot body: {
    ...File;
  },
): void;
```

### Using files in multipart payloads

Multipart payloads are commonly used to upload files (e.g. in HTML forms). To declare a multipart part that has a file body, ensure the part's type follows the same rules as for request and response payloads: it must either _be_ a type that is effectively an instance of `Http.File`, or must have an explicit body property that _effectively_ is-or-extends `Http.File`. All of the following examples declare multipart parts that have file bodies:

```typespec
// The type of the form-data part is _exactly_ a File, so the part has a file body.
op multipartUpload(
  @multipartBody fields: {
    file: HttpPart<File>;
  },
): void;

// The type of the form-data part has an explicit body that is _exactly_ a File, so the part has a file body.
op multipartUpload(
  @multipartBody fields: {
    file: HttpPart<{
      @bodyRoot file: File;
    }>;
  },
): void;

// The type of the mixed part is _exactly_ a File, so the part has a file body.
op multipartMixedDownload(): {
  @multipartBody data: [HttpPart<File>];
};

// The type of the mixed part has an explicit body that is _exactly_ a File, so the part has a file body.
op multipartMixedDownload(): {
  @multipartBody data: [
    HttpPart<{
      @bodyRoot file: File;
    }>
  ];
};
```

All of the above examples will also have file bodies if `File` is replaced with a model that extends `File` or a model that is _effectively_ `File` (e.g. `{...File}`).

You can also mix and match parts that have file bodies with other parts. The following TypeSpec gives a more comprehensive example of uploading data alongside files:

```typespec
model Widget {
  id: string;
  name: string;
  weight: float64;
}

op multipartUpload(
  @multipartBody fields: {
    // The widget is uploaded in a part named `widget` and uses form-urlencoded serialization.
    widget: HttpPart<{
      @header contentType: "application/x-www-form-urlencoded";
      @body widget: Widget;
    }>;

    // The part named `attachments` can be sent multiple times, and each `attachments` part has a file body.
    attachments: HttpPart<File>[];
  },
): void;
```

For more information about the handling of multipart payloads in `@typespec/http`, see [Multipart](./multipart.md);

## Creating custom `File` models

You can declare custom types of files by providing arguments to the `Http.File` template or extending it. Custom files can be used to add additional constraints on the contents of files or to override the location metadata of the `filename` property. For example, to declare a file that can contain PNG or JPEG images:

```typespec
alias ImageFile = File<"image/png" | "image/jpeg">;

// or

model ImageFile extends File<"image/png" | "image/jpeg"> {}

// or

model ImageFile extends File {
  contentType: "image/png" | "image/jpeg";
}
```

The above examples are equivalent ways to narrow the allowed media types of the file's contents. For convenience, you can specify the `ContentType` parameter of the `File` template inline, or you can override the type of the property in your own model that extends `File`.

The extra `contentType` information in these custom files provides an extra contractual guarantee about what kinds of data can be inside the file. In the above case, it is guaranteed to be either PNG or JPEG image data. The allowed `Content-Type` header values for the payload are also restricted to only allow those values that satisfy the `contentType` property's type.

**NOTE**: While you can override the type of properties within `Http.File` by extending it, you cannot define _additional_ properties.

### Overriding the `filename` location

By default, the `filename` is located in the `Content-Disposition` header of response and multipart payloads, but that header is not valid for request payloads. If you wish to send the `filename` in a request, you must override the location. For example, the follwing TypeSpec defines an `OpenAPIFile` in which the `filename` is appended to the route path when a file is uploaded, but since `@path` only applies to _requests_, the `filename` will still be returned in the `Content-Dispotion` header in responses or multipart payloads:

```typespec
model OpenAPIFile extends File<"application/json" | "application/yaml"> {
  @path filename: string;
}

@route("/specs")
interface Specs {
  upload(@bodyRoot file: OpenAPIFile): void;

  download(@path name: string): OpenAPIFile;
}
```

**NOTE**: Header metadata is applicable in all contexts, so if you use a custom header (e.g. `@header("x-filename") filename: string`) in your custom file, beware that it will apply to request, response, and multipart payloads equally.

### Textual files

The `File` template accepts a `Contents` argument that may be `TypeSpec.string`, `TypeSpec.bytes`, or any scalar that extends them. If the `Contents` argument is or extends `TypeSpec.string`, the file is considered a _textual_ file. For example:

```typespec
// Since `Contents` is `string`, this file type can only contain text data.
alias TextFile = File<Contents = string>;

// This file type can only contain text and is guaranteed to have `contentType: "application/yaml"`.
model YamlFile extends File<"application/yaml", string> {}

// This file is another way to declare YamlFile by overriding the type of `contentType`
model YamlFile extends File<Contents = string> {
  contentType: "application/yaml";
}
```

Textual files provide an extra contractual guarantee that the contents of the file must be text (i.e. the contents can be represented as a `string`).

**NOTE**: TypeSpec does not prescribe any specific text encoding. Emitters and libraries should take care to honor the `charset` of the file if one is specified, and should assume UTF-8 encoding in the absence of any protocol-level indication of the text encoding on the wire.

## `Http.File` as a structured model

In other cases, when `Http.File` is not the body of a request or response, it is treated as a structured model just like any other ordinary model. The TypeSpec HTTP library will generally warn you in cases where the `File` _looks like_ it might indicate a file body, but does not because of the library's rules.

### `File` properties inside other models

If a property of a model is a `File`, and that model is serialized as JSON, the structure of the File will be serialized as JSON inline, with the contents encoded as Base64 data. For example, in the following operation:

```typespec
model Example {
  id: string;
  attachment?: File;
}

op getExample(@path id: string): Example;
```

The response body with the `File` serialized as JSON looks like:

```json
{
  "id": "<string>",
  "attachment": {
    "contentType": "<string?>",
    "filename": "<string?>",
    "contents": "<base64>"
  }
}
```

### `File` inside a union

If `File` is a variant of a union in an exact body, it is _not_ treated as a file body. For example:

```typespec
// Warning: An HTTP File in a union is serialized as a structured model
// instead of being treated as the contents of a file...
op uploadFileOrString(@path id: string, @body data: File | string): void;
```

The above operation accepts _either_ a `text/plain` string _or_ a JSON-encoded `File` object body, not a file body. To declare a single operation that accepts either a `text/plain` string _or_ a file body, declare two separate operations using `@sharedRoute`:

```typespec
@sharedRoute
op uploadFile(@path id: string, @body data: File): void;

@sharedRoute
op uploadString(@path id: string, @body data: string): void;
```

`File` can be in a union in an HTTP response and still create a file body, but only if the union is itself the return type and not in an explicit body property. The HTTP library recognizes the variants of a union that is returned from an operation as individual and separate responses, and it is allowed to have a response type that is a `File` alongside other non-file responses, but if a single response has a type that is a union that contains file, the same warning as above will appear and the `File` will be treated as a structured model.

```typespec
// This is allowed and creates a file body, as `File` and `string` are considered separate responses, so
// this operation has two responses; the first has a file body, and the second has a `text/plain` string body.
op downloadFileOrString(): File | string;

// The following does not create a file body, as it is only one response where the body of that single response
// may be either a file or a string.

// Warning: An HTTP File in a union is serialized as a structured model
// instead of being treated as the contents of a file...
op downloadFileOrString(): {
  @bodyRoot data: File | string;
};
```

### `File` in intersections and composite spreads

An HTTP request or response is only _effectively_ a `File` (and therefore has a file body) if it has _all_ the properties of `File` and no other properties. Attempting to intersect a `File` or spread a `File` into a request, response, or multipart payload that includes other properties will not create a file body. For example:

```typespec
// Not a file body. The fields of `File` will be serialized as JSON in the response body.
op getFileInIntersection(): {
  @bodyRoot data: OkResponse & Http.File;
};

// Not a file body. The fields of `File` will be serialized as JSON in the response body.
op getFileInCompositeSpread(): {
  @statusCode _: 200;
  ...Http.File;
};

// Not a file body. The fields of `File` will be serialized as JSON in the request body.
op postFileInIntersection(
  @bodyRoot data: {
    @path id: string;
  } & Http.File,
): void;

// Not a file body. The fields of `File` will be serialized as JSON in the request body.
op postFileInCompositeSpread(@path id: string, ...Http.File): void;
```

For the body to be recognized as a file body, ensure that the `File` is exactly the body or is the only thing spread into the body:

```typespec
op getFile(): {
  @statusCode _: 200;
  @bodyRoot file: Http.File;
};

op postFile(@path id: string, @bodyRoot file: Http.File): void;

// Also a file body. Spread is allowed and recognized as a file body as long as `File` is the
// only source of properties in the model.

op getFile(): {
  @statusCode _: 200;
  @bodyRoot file: {
    ...Http.File;
  };
};

op postFile(
  @path id: string,
  @bodyRoot file: {
    ...Http.File;
  },
): void;
```

### `File` with an explicit `Content-Type` header

Operations are only considered to have file bodies if there is no explicit declaration of a `Content-Type` header in the payload. If an explicit `Content-Type` header is present, the `File` is **always** considered a structured model and is not treated as a file body. The following operation does not have a file body:

```typespec
// Warning: HTTP File body is serialized as a structured model in 'application/json' instead of being
// treated as the contents of a file because an explicit Content-Type header is defined.
op download(): {
  @header contentType: "application/json";
  @body file: File<Contents = string>;
};
```

The explicit `Content-Type` header is not merely metadata. The HTTP library treats this header declaration as a _directive_ about how to serialize the body. In other words, the operation above says "serialize the type of the body as JSON, and the type of the body is `Http.File`." To declare an operation with a file body, where the file can only contain JSON data, provide the `ContentType` argument to the `File` template instead:

```typespec
op download(): File<"application/json", string>;
```

Similarly, and to maintain consistency, you cannot use an explicit `Content-Type` header to declare the content-type of binary files:

```typespec
// Warning: HTTP File body is serialized as a structured model in 'image/png, image/jpeg' instead of being
// treated as the contents of a file because an explicit Content-Type header is defined.
op downloadImage(): {
  @header contentType: "image/png" | "image/jpeg";
  @body file: File;
};

// Do this instead
op downloadImage(): File<"image/png" | "image/jpeg">;
```

## Library and emitter authoring notes

For library/emitter developers working with the `@typespec/http` programmatic API, you can always determine if an operation request, response, or multipart payload is a file body by checking if the `bodyKind` of an `HttpPayloadBody` is `"file"`. If the body kind is `"single"` (or any other kind), then the body _is not_ a file body.

File bodies require special handling to account for the special nature of files. When processing file bodies:

- Assume that the `contents` of the file are _always_ transmitted in the body without any further encoding.
- Assume that the `contentType` of the file _always_ comes from the `Content-Type` header of the corresponding request, response, or multipart payload.
- The `filename` should come from the `Content-Disposition` header of the response or multipart payload (there is no `filename` in requests by default), but be aware that spec authors may override this location using HTTP property metadata decorators like `@query` or `@header`.
- The `isText` field of the `HttpOperationFileBody` will be `true` if the file is contractually guaranteed to only contain text (i.e. if the `contents` property has a type that is or extends `TypeSpec.string`). Textual files are a subset of binary files, with the guarantee that the contents are plain text that can be converted to a `string`. See [_Textual files_](#textual-files) above.

See [the reference documentation of `HttpPayloadBody`](./reference/js-api/type-aliases/HttpPayloadBody.md) and [`HttpOperationFileBody`](./reference/js-api/interfaces/HttpOperationFileBody.md) for more information
