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

By "effectively a model that is or extends `Http.File`," we mean cases where an explicit body property is provided and its type is or extends `Http.File` as well as cases where `Http.File` is spread into a request or response payload or `Http.File` is intersected with other models in a request or response and the only non-metadata properties in the payload are properties of `File` (see [_When a model is effectively a `File`_](#when-a-model-is-effectively-a-file) below for a more precise description with examples). The following sections contain examples of using `Http.File` in various contexts to define operations that have file bodies.

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

// File is intersected with other models containing only HTTP metadata, so the response has a file body.
op download(): OkResponse & File;

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

alias FileRequest = {
  @header("x-request-id") requestId: string;
} & File;

// File is intersected with other models containing only HTTP metadata, so the request has a file body.
op upload(...FileRequest): void;

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

For more information about the handling of multipart payloads in `@typespec/http`, see [Multipart](./multipart.md).

### When a model is _effectively_ a `File`

In the above sections, we used the idea of "effective" files. In the context of an HTTP operation, a model is _effectively_ a file if it has _all_ of the properties of `Http.File` (true properties of `Http.File` from a spread or intersection, not just properties that have the same shape as a `File`) **AND** after removing all of the _applicable_ metadata properties, it has _only_ properties of `Http.File`.

- A property of `Http.File` means a property that is actually sourced from the `Http.File` model, e.g. through spreading `File` into another model or using `model is` syntax.
- _Applicable metadata_ means an HTTP metadata decorator that _applies_ in context. For example, `@path` is applicable in requests, but not response or multipart payloads. `@statusCode` is applicable in responses, but not request or multipart payloads.

The following table shows which metadata annotations are applicable in which contexts:

| **Metadata** | **`@header`** | **`@query`** | **`@statusCode`** | **`@path`** |
| ------------ | ------------- | ------------ | ----------------- | ----------- |
| Request      | ✅            | ✅           | ❌                | ✅          |
| Response     | ✅            | ❌           | ✅                | ❌          |
| Multipart    | ✅            | ❌           | ❌                | ❌          |

#### Examples that are effectively a `File`

```typespec
// The parameters of this operation are effectively a file because the @header parameter
// is not considered when checking if the request is a file
op uploadFileWithHeader(@header("x-request-id") requestId: string, ...Http.File): void;

model CommonParameters {
  @query("api-version") apiVersion: string;
  @header("x-request-id") requestId: string;
}

// The parameters of this operation are effectively a file because the common parameters
// are all applicable metadata and not considered when checking if the request is a file
op uploadFileWithCommonParams(...CommonParameters, ...File): void;

// The response has a file body because the `@statusCode` property is not considered when
// checking if the response is a file
op downloadFileWithStatusCode(@path name: string): {
  @statusCode _: 200;
  ...File;
};

// The response has a file body because the `OkResponse` model only has response-applicable
// metadata that is not considered when checking if the response is a file
op downloadFileWithIntersection(@path name: string): OkResponse & File;

model OpenAPIFile extends File<"application/json" | "application/yaml", string> {
  @path filename: string;
}

// The response and request have file bodies because the common parameters are all
// applicable metadata in the request, and the `OkResponse` model only contains
// applicable metadata for the response.
op uploadAndDownload(...CommonParameters, ...OpenAPIFile): OkResponse & OpenAPIFile;

model FileData {
  @header("x-created") created: utcDateTime;
  ...File;
}

// The request has a file body because the `created` header is applicable metadata for
// responses, and the rest of `FileData` is the properties of `File`.
op upload(@bodyRoot file: FileData): OkResponse;

// The response has a file body because the `OkResponse` model only contains applicable
// metadata for the response, and the `created` header is also applicable in the response.
// The properties that are left over are the properties of `File`.
op download(): OkResponse & FileData;
```

#### Examples that are _not_ effectively a `File`

```typespec
// The request does not have a file body because the `userId` parameter is a body property,
// so this will cause the `File` to be serialized as JSON in the request.
op uploadFileWithExtraParam(userId: string, ...File): void;

model FileData {
  @query created: utcDateTime;
  ...File;
}

// The response does not have a file body because `@query` metadata is not applicable
// in responses, so the `created` property is placed in the body and the whole `FileData`
// model is serialized as JSON.
op download(): FileData;

model OpenAPIFile extends File<"application/json" | "application/yaml", string> {
  @path filename: string;
}

model OpenAPIFileResponse {
  @statusCode statusCode: 200;
  ...SpecFile;
}

// The request does not have a file body because the `statusCode` property is not
// applicable metadata for requests, so the request body would be serialized as a JSON
// object. The same model _would_ create a file body in a response, though.
op upload(@bodyRoot data: OpenAPIFileResponse): void;
```

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

In other cases, when `Http.File` is not _itself_ the body of a request or response, it is treated as a structured model just like any other ordinary model. The TypeSpec HTTP library will generally warn you in cases where the `File` _looks like_ it might indicate a file body, but does not because of the library's rules.

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

The above operation accepts _either_ a `text/plain` string _or_ a JSON-serialized `File` object body, not a file body. To declare a single operation that accepts either a `text/plain` string _or_ a file body, declare two separate operations using `@sharedRoute`:

```typespec
@sharedRoute
op uploadFile(@path id: string, @body data: File): void;

@sharedRoute
op uploadString(@path id: string, @body data: string): void;
```

`File` can be in a union in an HTTP response and still create a file body, but only if the union is itself the return type and not in an explicit body property. The HTTP library recognizes the variants of a union that is returned from an operation as individual and separate responses, and it is allowed to have a response type that is a `File` alongside other non-file responses, but if a single response has a type that is a union that contains file, the same warning as above will appear and the `File` will be treated as a structured model:

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

See [the reference documentation of `HttpPayloadBody`](./reference/js-api/type-aliases/HttpPayloadBody.md) and [`HttpOperationFileBody`](./reference/js-api/interfaces/HttpOperationFileBody.md) for more information.
