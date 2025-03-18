# Should generate inline models

When a model property's type is defined as an anonymous model, the TypeScript emitter should generate the model definition inline, matching the spec closely.

## Typespec

```tsp
namespace Test;
model Widget {
  name: string;
  subWidget: {
    location: string;
    age?: int32;
  };
}
op foo(): Widget;
```

## Typescript

```ts src/models/models.ts interface Widget
export interface Widget {
  name: string;
  subWidget: { location: string; age?: number };
}
```
