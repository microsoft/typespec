# Request with headers, body and query parameters

A typical request with path, query header and body parameters. The body is modeled as a spread model to the operation

## TypeSpec

```tsp
 @service({
      title: "Widget Service",
    })
    namespace DemoService;

    @test model Widget {
      @path id: string;
      @header etag: string;
      @query foo: string;
      name: string;
    }

    @route("/widgets")
    interface Widgets {
      @post read(...Widget): void;
    }
```

## TyeScript

### Operations

It should generate an operation placing the parameters in the right place. The path and query parameters as part of the url template, the headers in the request options and correctly place the body payload into the body within the http request options

```ts src/api/widgetsClient/widgetsClientOperations.ts function read
export async function read(
  client: WidgetsClientContext,
  foo: string,
  etag: string,
  id: string,
  name: string,
): Promise<void> {
  const path = parse("/widgets/{id}{?foo}").expand({
    id: id,
    foo: foo,
  });

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
      etag: etag,
    },
    body: {
      name: name,
    },
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

### Client Class

It should generate the client class with the read operation that calls the operation under api

```ts src/demoServiceClient.ts class WidgetsClient
export class WidgetsClient {
  #context: WidgetsClientContext;

  constructor(endpoint: string, options?: WidgetsClientOptions) {
    this.#context = createWidgetsClientContext(endpoint, options);
  }
  async read(foo: string, etag: string, id: string, name: string) {
    return read(this.#context, foo, etag, id, name);
  }
}
```
