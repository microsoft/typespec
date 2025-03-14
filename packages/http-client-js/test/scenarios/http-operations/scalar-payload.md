# Request with a scalar body

A request that sends a body payload of scalar type

## TypeSpec

The body is modeled as an explicit body property of type int32

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test @post create(@body count: int32): void;
}
```

## TyeScript

### Operations

It should generate an operation that sends the body as number. Since the body is an explicit property, a serializer function for the operation is created

```ts src/api/widgetsClient/widgetsClientOperations.ts function create
export async function create(
  client: WidgetsClientContext,
  count: number,
  options?: CreateOptions,
): Promise<void> {
  const path = parse("/widgets").expand({});
  const httpRequestOptions = {
    headers: {},
    body: count,
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

### Serializers

The correct serializer function is created, since this is a number payload, no additional serialization is needed.

```ts src/models/serializers.ts function createPayloadToTransport
export function createPayloadToTransport(payload: number) {
  return payload!;
}
```
