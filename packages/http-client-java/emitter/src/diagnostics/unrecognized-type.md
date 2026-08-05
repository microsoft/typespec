This diagnostic is issued when the Java emitter receives an SDK type kind that it cannot map to a Java schema. Specialized messages identify unsupported union or multipart property kinds.

## Impact

Java client generation stops because the emitter cannot determine a safe Java representation.

## ❌ Incorrect Usage

This usually indicates an unsupported TypeSpec shape or a version mismatch between the Java emitter and `@azure-tools/typespec-client-generator-core`. It can also occur when a union or multipart model contains a type kind that the emitter does not support.

## Diagnostic Message

Messages include:

```text
Unrecognized type, kind '<kind>'. Updating the version of the emitter may resolve this issue.
```

```text
Unrecognized type for Union, kind '<kind>'.
```

```text
Unrecognized type for multipart form data, kind '<kind>'.
```

## ✅ How to Fix

Update the Java emitter and TypeSpec dependencies together. If the error identifies a union or multipart property, replace the unsupported member with a supported scalar, model, array, or file type. If the kind should be supported, report an emitter issue with a minimal TypeSpec reproduction.
