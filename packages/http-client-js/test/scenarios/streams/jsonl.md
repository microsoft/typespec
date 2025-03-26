# only: Should support generate as bytes for jsonl streams

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@route("/")
op get(stream: HttpStream<Thing, "application/jsonl", string>): void;
model Thing { id: string }
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/widgetsClient/widgetsClientOperations.ts function get
```
