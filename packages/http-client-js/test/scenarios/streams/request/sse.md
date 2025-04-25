# Should generate as bytes for sse

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
model UserConnect {
  username: string;
  time: string;
}
model UserMessage {
  username: string;
  time: string;
  text: string;
}
model UserDisconnect {
  username: string;
  time: string;
}
@Events.events
union ChannelEvents {
  userconnect: UserConnect,
  usermessage: UserMessage,
  userdisconnect: UserDisconnect,

  @Events.contentType("text/plain")
  @terminalEvent
  "[unsubscribe]",
}
op subscribeToChannel(stream: SSEStream<ChannelEvents>): void;
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function subscribeToChannel
export async function subscribeToChannel(
  client: ClientContext,
  body: Uint8Array,
  options?: SubscribeToChannelOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "text/event-stream",
    },
    body: body,
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```
