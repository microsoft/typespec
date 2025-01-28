# Request with that has a path parameter directly on the operation

A request that sends a request with a path parameter directly on the operation signature

## TypeSpec

The path parameter is a positional parameter in the operation signature

```tsp
    @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @route("/widgets")
    @tag("Widgets")
    interface Widgets {
      @test @get read(@path id: string): void;
    }
```

## TyeScript

### Operations

It should generate an operation that places the path parameter in the url template.

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  id: string,
): Promise<void> {
  const path = parse("/widgets/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```
