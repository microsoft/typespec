# Should generate a model that spreads a Record

## TypeSpec

```tsp
@service
namespace Test;
model ExtraFeature {
  id: string;
  name: string;
  value: int32;
}

model Dog {
  id: string;
  name: string;
  color: "black" | "brown";
  ...Record<ExtraFeature>;
}

op foo(): Dog;
```

## Models

```ts src/models/models.ts interface ExtraFeature
export interface ExtraFeature {
  id: string;
  name: string;
  value: number;
}
```

```ts src/models/models.ts interface Dog
export interface Dog {
  id: string;
  name: string;
  color: "black" | "brown";
}
```

## Serializer

```ts src/models/internal/serializers.ts function jsonDogToTransportTransform
export function jsonDogToTransportTransform(input_?: Dog | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonRecordExtraFeatureToTransportTransform((({ id, name, color, ...rest }) => rest)(input_)),
    id: input_.id,
    name: input_.name,
    color: input_.color,
  }!;
}
```

## Deserializer

```ts src/models/internal/serializers.ts function jsonDogToApplicationTransform
export function jsonDogToApplicationTransform(input_?: any): Dog {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonRecordExtraFeatureToApplicationTransform(
      (({ id, name, color, ...rest }) => rest)(input_),
    ),
    id: input_.id,
    name: input_.name,
    color: input_.color,
  }!;
}
```
