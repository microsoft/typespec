# Should generate a basic TypeScript project

## TypeSpec

```tsp
op doWork(value: string): string;
op doMoreWork(value: string): string;
```

## TypeScript

Should generate a typescript function with name `doWork`

```ts client.ts function doWork
export function doWork(value: string): string {
  return "stub";
}
```

Should generate a typescript function with name `doMoreWork`

```ts client.ts function doMoreWork
export function doMoreWork(value: string): string {
  return "stub";
}
```
