# Should generate a basic client context factory

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
namespace DemoService;
```

## TypeScript

Should generate a factory function named after the namespace `createDemoServiceContext`. Since there is no url defined the factory takes an endpoint parameter

```ts src/api/clientContext.ts function createDemoServiceContext
export function createDemoServiceContext(
  endpoint: string,
  options: DemoServiceOptions
): DemoServiceContext {
  return {
    endpoint,
  };
}
```

# Should generate a basic client context factory that defines a url

## TypeSpec

```tsp
@service({
  title: "Widget Service",
})
@server("https://example.org/api", "Location of the service")
namespace DemoService;
```

## TypeScript

Should generate a factory function named after the namespace `createDemoServiceContext`. Since there is a url defined the factory doesn't take the endpoint parameter.

Endpoint should be overridable with options, if no options.endpoint provided it fallsback to the default defined in the `@server` decorator

```ts src/api/clientContext.ts function createDemoServiceContext
export function createDemoServiceContext(options: DemoServiceOptions): DemoServiceContext {
  const endpoint = options.endpoint ?? "https://example.org/api";
  return {
    endpoint,
  };
}
```
