# Should generate a client context factory for a simple client

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;
op foo(): void;
```

## TypeScript

Should generate a factory function named after the namespace `createDemoServiceContext`. Since there is no url defined the factory takes an endpoint parameter

```ts src/api/demoServiceClientContext.ts function createDemoServiceClientContext
export function createDemoServiceClientContext(
  endpoint: string,
  options?: DemoServiceClientOptions,
): DemoServiceClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint,
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params
      ? String(params[key])
      : (() => {
          throw new Error(`Missing parameter: ${key}`);
        })(),
  );
  return getClient(resolvedEndpoint, {
    ...options,
  });
}
```
