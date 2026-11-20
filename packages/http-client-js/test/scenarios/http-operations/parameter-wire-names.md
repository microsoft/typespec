# Request parameters whose wire name differs from the property name

The keys passed to the URI template `expand()` must match the template variables, and header keys must match the header names.

## TypeSpec

```tsp
@service(#{ title: "Widget Service" })
namespace DemoService;

@route("/widgets/{function}")
@tag("Widgets")
interface Widgets {
  @test
  @get
  read(
    @path("function") functionName: string,
    @query("on_conflict") onConflict?: string,
    @query("filter[isActive]") filterIsActive?: boolean,
    @query("not.or") notOr?: string,
    @header("X-Count") count?: int32,
  ): void;
}
```

## TypeScript

### Request

It should use the URI template variable names as `expand()` keys and the header name as the header key.

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  functionName: string,
  options?: ReadOptions,
): Promise<void> {
  const path = parse("/widgets/{function}{?on_conflict,filter%5BisActive%5D,not.or}").expand({
    function: functionName,
    ...(options?.onConflict && { on_conflict: options.onConflict }),
    ...(options?.filterIsActive && {
      "filter%5BisActive%5D": options.filterIsActive,
    }),
    ...(options?.notOr && { "not.or": options.notOr }),
  });
  const httpRequestOptions = {
    headers: {
      ...(options?.count && { "x-count": options.count }),
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
