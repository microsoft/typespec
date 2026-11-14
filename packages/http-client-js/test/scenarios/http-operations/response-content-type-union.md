# Response content-type literal union

Accept every media type declared in a response header union, including a JSON structured syntax suffix.

## TypeSpec

```tsp
@service
namespace TestService;

model Doc {
  title: string;
}

@route("/docs")
interface Docs {
  @get read(): {
    @header contentType: "application/openapi+json" | "application/json";
    @body body: Doc;
  };
}
```

## Response handling

```ts src/api/docsClient/docsClientOperations.ts function read
export async function read(client: DocsClientContext, options?: ReadOptions): Promise<Doc> {
  const path = parse("/docs").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (
    +response.status === 200 &&
    response.headers["content-type"]?.includes("application/openapi+json")
  ) {
    return jsonDocToApplicationTransform(response.body)!;
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonDocToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```
