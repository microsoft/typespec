This diagnostic is issued when a bytes, duration, or date-time type uses an encoding that the Java emitter does not recognize.

## Impact

The emitter falls back to the wire type or a string representation, so the generated Java type may not preserve the intended encoding.

## ❌ Incorrect Usage

```typespec
@encode("custom-datetime")
scalar CustomDateTime extends utcDateTime;
```

## Diagnostic Message

```text
Encode 'custom-datetime' is not supported.
```

## ✅ How to Fix

Use a standard encoding supported by the corresponding TypeSpec scalar.

```typespec
@encode(DateTimeKnownEncoding.rfc3339)
scalar CustomDateTime extends utcDateTime;
```

## Suppression

Do not suppress this warning unless the fallback Java representation and wire format have been verified.
