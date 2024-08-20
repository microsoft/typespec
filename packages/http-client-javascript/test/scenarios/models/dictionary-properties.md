# Should generate a model with a porperty wich is a dictionary

## TypeSpec

```tsp
model Widget {
  prop: Record<int32>;
}
```

## TypeScript

Should generate a model with name `Widget` that contains dictionary properties

```ts models.ts interface Widget
export interface Widget {
  prop: Record<string, number>;
}
```

# Should generate a model with a porperty wich is a dictionary of an array

## TypeSpec

```tsp
model Widget {
  prop: Record<int32[]>;
}
```

## TypeScript

Should generate a model with name `Widget` that contains dictionary properties with array

```ts models.ts interface Widget
export interface Widget {
  prop: Record<string, number[]>;
}
```
