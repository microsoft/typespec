This diagnostic is issued when the Java emitter cannot form a safe convenience-method signature.

## Impact

The protocol API remains available, but the convenience API is omitted for the operation.

## Multiple Content Types

```typespec
@post
op upload(@body data: bytes, @header contentType: "application/octet-stream" | "image/png"): void;
```

```yaml
options:
  "@typespec/http-client-java":
    flavor: azure
```

This TypeSpec definition is valid. Customize the generated Java library to add a convenience API with the appropriate method signature and behavior for the operation. The generated protocol API can be used as the underlying implementation.

## JSON Merge Patch Without Stream-Style Serialization

```typespec
@patch
op update(@header contentType: "application/merge-patch+json", @body body: WidgetPatch): void;
```

```yaml
options:
  "@typespec/http-client-java":
    flavor: azure
    stream-style-serialization: false
```

Enable stream-style serialization:

```yaml
options:
  "@typespec/http-client-java":
    flavor: azure
    stream-style-serialization: true
```

## Diagnostic Message

The message identifies either multiple content types or JSON merge patch as the reason the convenience API was not generated.

## Suppression

For multiple content types, suppress the warning after adding the required convenience API customization, or when a protocol-only API surface is intentional. Do not suppress the JSON merge patch warning; enable stream-style serialization instead.
