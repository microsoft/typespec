This diagnostic is issued when the Java emitter cannot form a safe convenience-method signature.

## Impact

The protocol API remains available, but the convenience API is omitted for the operation.

## Multiple Content Types

```typespec
@post
op upload(@body data: bytes, @header contentType: "application/octet-stream" | "image/png"): void;
```

This TypeSpec definition is valid. Customize the generated Java library to add a convenience API with the appropriate method signature and behavior for the operation. The generated protocol API can be used as the underlying implementation.

## Diagnostic Message

The message identifies multiple content types as the reason the convenience API was not generated.

## Suppression

Suppress the warning after adding the required convenience API customization, or when a protocol-only API surface is intentional.
