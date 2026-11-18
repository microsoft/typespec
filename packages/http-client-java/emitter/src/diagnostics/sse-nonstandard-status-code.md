This warning is issued when a supported Java SSE operation declares a streaming response status other than `200` or `204`.

## Impact

Java generation continues with typed SSE support. The generated operation proxy validates the operation's declared response status codes. For an accepted non-`204` response, the SSE decoder requires `Content-Type: text/event-stream` and a response body. An accepted `204` response completes without events.

The [WHATWG EventSource specification](https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface) expects `200` for an event stream. A `204` response means no content and stops reconnection. Other statuses, such as `201`, are not compatible with browser `EventSource`, even though the generated Java client can decode their event streams.

## How to Fix

Use `200` for streaming responses if the service must support browser `EventSource`. If the service intentionally uses a different status, retain the declared status and suppress this warning on the operation.

## Suppression

```tsp
#suppress "@typespec/http-client-java/sse-nonstandard-status-code" "The service intentionally returns 201."
@get
op read(): {
  @statusCode statusCode: 201;
  ...SSEStream<Events>;
};
```

Suppression does not change generation or runtime status validation.
