# Should generate a model with a property which is a dictionary

## TypeSpec

```tsp
namespace Test;

model Widget {
  prop: Record<int32>;
}
op foo(): Widget;
```

## TypeScript

Should generate a model with name `Widget` that contains dictionary properties

```ts src/models/models.ts interface Widget
export interface Widget {
  prop: Record<string, number>;
}
```

# Should generate a model with a porperty wich is a dictionary of an array

## TypeSpec

```tsp
namespace Test;
model Widget {
  prop: Record<int32[]>;
}
op foo(): Widget;
```

## TypeScript

Should generate a model with name `Widget` that contains dictionary properties with array

```ts src/models/models.ts interface Widget
export interface Widget {
  prop: Record<string, Array<number>>;
}
```
