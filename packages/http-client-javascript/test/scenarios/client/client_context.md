# Should generate a client with complex structure

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
  return getClient(endpoint, {
    ...options,
  });
}
```
