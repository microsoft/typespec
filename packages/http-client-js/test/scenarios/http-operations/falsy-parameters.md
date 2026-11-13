# Optional request parameters with falsy values

Optional query and header parameters must be sent when their value is falsy but defined, such as `0`, `""` or `false`.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @test
  @get
  read(
    @query limit?: int32,
    @query name?: string,
    @query isActive?: boolean,
    @header count?: int32,
  ): void;
}
```

## TypeScript

### Request

It should check for `undefined`, not for truthiness, before it adds a parameter.

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(client: WidgetsClientContext, options?: ReadOptions): Promise<void> {
  const path = parse("/widgets{?limit,name,isActive}").expand({
    ...(options?.limit != undefined && { limit: options.limit }),
    ...(options?.name != undefined && { name: options.name }),
    ...(options?.isActive != undefined && { isActive: options.isActive }),
  });
  const httpRequestOptions = {
    headers: {
      ...(options?.count != undefined && { count: options.count }),
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```
