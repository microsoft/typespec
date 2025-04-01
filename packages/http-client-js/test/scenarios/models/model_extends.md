# Should generate a model that extends another model

## TypeSpec

```tsp
@service
namespace Test;
model Pet {
  id: string;
  name: string;
}

model Dog extends Pet {
  color: "black" | "brown";
}

op foo(): Dog;
```

## Models

Should generate an interface for the base model and an interface for Dog that extends Pet

```ts src/models/models.ts interface Pet
export interface Pet {
  id: string;
  name: string;
}
```

```ts src/models/models.ts interface Dog
export interface Dog extends Pet {
  color: "black" | "brown";
}
```

## Serializers

Should generate a serializer for Pet. Also a serializer for Dog that calls the Pet serializer

### Pet Serializer

```ts src/models/internal/serializers.ts function jsonPetToTransportTransform
export function jsonPetToTransportTransform(input_?: Pet | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    id: input_.id,
    name: input_.name,
  }!;
}
```

### Pet deserializer

```ts src/models/internal/serializers.ts function jsonPetToApplicationTransform
export function jsonPetToApplicationTransform(input_?: any): Pet {
  if (!input_) {
    return input_ as any;
  }
  return {
    id: input_.id,
    name: input_.name,
  }!;
}
```

### Dog Serializer

```ts src/models/internal/serializers.ts function jsonDogToTransportTransform
export function jsonDogToTransportTransform(input_?: Dog | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    color: input_.color,
    id: input_.id,
    name: input_.name,
  }!;
}
```

### Dog deserializer

```ts src/models/internal/serializers.ts function jsonDogToApplicationTransform
export function jsonDogToApplicationTransform(input_?: any): Dog {
  if (!input_) {
    return input_ as any;
  }
  return {
    color: input_.color,
    id: input_.id,
    name: input_.name,
  }!;
}
```
