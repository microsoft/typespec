This diagnostic is issued when `responseHeadersAsModel` is enabled for an operation that also returns a response body.

## Impact

Java client generation fails because the option is only defined for returning significant response headers from bodyless operations.

## ❌ Incorrect Usage

```typespec
op getWidget(): {
  @statusCode statusCode: 200;
  @header eTag: string;
  @body body: Widget;
};

@@clientOption(getWidget, "responseHeadersAsModel", true, "java");
```

## Diagnostic Message

```text
Client option 'responseHeadersAsModel' cannot be used on operation 'getWidget', because it has a response body.
```

## ✅ How to Fix

Remove the option for operations with response bodies. Use it only when the response contains significant headers and no body.

```typespec
op getWidgetMetadata(): {
  @statusCode statusCode: 200;
  @header eTag: string;
};

@@clientOption(getWidgetMetadata, "responseHeadersAsModel", true, "java");
```
