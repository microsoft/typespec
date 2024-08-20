# Should generate a model with a porperty with array

## TypeSpec

```tsp
model Widget {
  id: string[];
  weight: int32[];
  color: ("red" | "blue")[];
}
```

## TypeScript

Should generate a model with name `Widget` that contains array properties

```ts models.ts interface Widget
export interface Widget {
  id: string[];
  weight: number[];
  color: ("red" | "blue")[];
}
```

# Should generate a model with a porperty with array of record

## TypeSpec

```tsp
model Widget {
  id: Record<int32>[];
}
```

## TypeScript

Should generate a model with name `Widget` that contains array properties of record type

```ts models.ts interface Widget
export interface Widget {
  id: Record<string, number>[];
}
```
