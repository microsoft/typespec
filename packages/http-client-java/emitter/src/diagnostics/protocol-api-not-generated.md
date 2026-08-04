This diagnostic is issued when an Azure-flavored multipart operation would produce a protocol API that is not usable with the generated request shape.

## Impact

The convenience API is generated, but the protocol API is omitted for the operation.

## Example Usage

```typespec
model UploadForm {
  file: HttpPart<bytes>;
}

@post
op upload(@header contentType: "multipart/form-data", @multipartBody body: UploadForm): void;
```

## Diagnostic Message

```text
Operation 'upload' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not generated.
```

## How to Address

No change is required. Use the generated convenience API for the multipart operation.

## Suppression

It is safe to ignore or suppress this notification when the generated convenience API is sufficient.
