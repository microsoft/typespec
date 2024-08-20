# Should generate inline models

When a model property's type is defined as an anonymous model, the TypeScript emittew should generate the model definition inline, matching the spec closely.

## Typespec

```tsp
model Widget {
  name: string;
  subWidget: {
    location: string;
    age?: int32;
  };
}
```

## Typescript

```ts models.ts interface Widget
export interface Widget {
  name: string;
  subWidget: {
    location: string;
    age?: number;
  };
}
```
