# Should generate a model with a property with array

## TypeSpec

```tsp
namespace Test;
model Widget {
  id: string[];
  weight: int32[];
  color: ("red" | "blue")[];
}
op foo(): Widget;
```

## TypeScript

Should generate a model with name `Widget` that contains array properties

```ts src/models/models.ts interface Widget
export interface Widget {
  id: Array<string>;
  weight: Array<number>;
  color: Array<"red" | "blue">;
}
```

# Should generate a model with a property with array of record

## TypeSpec

```tsp
namespace Test;
model Widget {
  id: Record<int32>[];
}
op foo(): Widget;
```

## TypeScript

Should generate a model with name `Widget` that contains array properties of record type

```ts src/models/models.ts interface Widget
export interface Widget {
  id: Array<Record<string, number>>;
}
```
