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
op subscribeToChannel(): SSEStream<ChannelEvents>;
```

## TypeScript

### Response

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function subscribeToChannel
export async function subscribeToChannel(
  client: ClientContext,
  options?: SubscribeToChannelOptions,
): Promise<Uint8Array> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("text/event-stream")) {
    return response.body!;
  }
  throw createRestError(response);
}
```
