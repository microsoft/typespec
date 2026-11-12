This diagnostic is issued when a response content-type header has a constant value and the Java emitter removes it from the generated response-header model.

## Impact

The constant header is not generated as a property in the response-header model because its value cannot vary.

## Example Usage

```typespec
op read(): {
  @statusCode statusCode: 200;
  @header contentType: "application/json";
  @body body: Widget;
};
```

## Diagnostic Message

```text
Constant header 'content-type' is removed from response headers.
```

## How to Address

No change is required. The TypeSpec definition is valid, and the warning only explains why the generated response-header model does not contain a property for this header.

## Suppression

It is safe to ignore or suppress this warning when the constant header does not need to be exposed as a property.
