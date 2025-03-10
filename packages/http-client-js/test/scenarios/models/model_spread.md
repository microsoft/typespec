# Should generate a model that spreads another model

## TypeSpec

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

model Dog {
  ...Pet;
  color: "black" | "brown";
}

op foo(): Dog;
```

## Models

Should generate an interface for the Dog that contains all properties from Pet

```ts src/models/models.ts interface Dog
export interface Dog {
  id: string;
  name: string;
  color: "black" | "brown";
}
```

## Serializers

### Dog Serializer

```ts src/models/serializers.ts function jsonDogToTransportTransform
export function jsonDogToTransportTransform(input_?: Dog | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    id: input_.id,
    name: input_.name,
    color: input_.color,
  }!;
}
```

### Dog deserializer

```ts src/models/serializers.ts function jsonDogToApplicationTransform
export function jsonDogToApplicationTransform(input_?: any): Dog {
  if (!input_) {
    return input_ as any;
  }
  return {
    id: input_.id,
    name: input_.name,
    color: input_.color,
  }!;
}
```
