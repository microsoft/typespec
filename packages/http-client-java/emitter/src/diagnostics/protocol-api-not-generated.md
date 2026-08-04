This diagnostic is issued when an Azure-flavored multipart operation would produce a protocol API that is not usable with the generated request shape.

## Impact

The convenience API is generated, but the protocol API is omitted for the operation.

## ❌ Incorrect Usage

```typespec
model UploadForm {
  file: HttpPart<bytes>;
}

@post
op upload(@header contentType: "multipart/form-data", @multipartBody body: UploadForm): void;
```

```yaml
options:
  "@typespec/http-client-java":
    flavor: azure
```

## Diagnostic Message

```text
Operation 'upload' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not generated.
```

## ✅ How to Fix

Use the generated convenience API. If a protocol API is required, redesign the operation to use a supported non-multipart request body.

## Suppression

The warning can be suppressed when omitting the protocol API is expected and the convenience API is sufficient.
