# Should generate a client with consistent and normal Typescript code no-format

This test verifies that a basic service with multiple routes results in "decently" formatted output.

The goal isn't perfect formatting, just some level of consistency for basic usecases. Prettier or other formatters should be run
to achieve actually good formatting.

- no double semicolons (constructor lines, createWidgetsClientContext, for example)
- the constructor properly separates sub-client assignments with newlines.
- each type declaration in the DemoServiceClient class has semicolons at the end, consistently.
- newlines separate `ClientContext` blocks

## TypeSpec

```tsp
@service(#{ title: "Multi Route Service" })
namespace DemoService;

model Widget {
  id: string;
  weight: int32;
}

model User {
  id: string;
  name: string;
}

@error
model Error {
  code: int32;
  message: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @get list(): Widget[] | Error;
  @get read(@path id: string): Widget | Error;
}

@route("/users")
@tag("Users")
interface Users {
  @get list(): User[] | Error;
  @get read(@path id: string): User | Error;
}
```

## TypeScript

### Client

It generates a root client with multiple sub-clients, each properly separated by newlines in the constructor.

```ts src/demoServiceClient.ts class DemoServiceClient
export class DemoServiceClient {
  #context: DemoServiceClientContext;
  widgetsClient: WidgetsClient;
  usersClient: UsersClient;
  constructor(endpoint: string, options?: DemoServiceClientOptions) {
    this.#context = createDemoServiceClientContext(endpoint, options);
    this.widgetsClient = new WidgetsClient(endpoint, options);
    this.usersClient = new UsersClient(endpoint, options);
  }
}
```

It should have interface/function end-curly-braces with a newline before the next one, and no double-semicolons:

```ts src/api/widgetsClient/widgetsClientContext.ts
import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface WidgetsClientContext extends Client {}
export interface WidgetsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createWidgetsClientContext(
  endpoint: string,
  options?: WidgetsClientOptions,
): WidgetsClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );
  return getClient(resolvedEndpoint,{
    ...options
  })
}

```
