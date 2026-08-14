This diagnostic is issued when an operation uses an enum request or response body with `text/plain`.

## Impact

The emitter substitutes `String` for the unsupported Java type on the request or response body.

## ❌ Incorrect Usage

```typespec
enum Color {
  red,
  blue,
}

@post
op setColor(@header contentType: "text/plain", @body color: Color): void;
```

## Diagnostic Message

```text
Complex SDK type is not supported for "text/plain" content-type. Emitter would use string type on 'setColor' request body.
```

## ✅ How to Fix

Use `string` for a text payload, or use a structured content type such as `application/json` when the SDK type should remain strongly typed.

```typespec
@post
op setColor(@header contentType: "text/plain", @body color: string): void;
```

## Suppression

Suppress the warning only when the generated `String` API is the intended contract.
