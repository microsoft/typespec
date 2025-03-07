# Should model correctly a discriminated type by inheritance

```tsp
@service
namespace Test;
@doc("Define a base class in the legacy way. Discriminator property is not explicitly defined in the model.")
@discriminator("kind")
model Dinosaur {
  size: int32;
}

@doc("The second level legacy model in polymorphic single level inheritance.")
model TRex extends Dinosaur {
  kind: "t-rex";
}

@get
op getLegacyModel(): Dinosaur;
```

## Models

```ts src/models/models.ts interface Dinosaur
export interface Dinosaur {
  size: number;
  kind: string;
}
```

```ts src/models/models.ts interface TRex
export interface TRex extends Dinosaur {
  kind: "t-rex";
}
```

## Serializer

```ts src/models/serializers.ts function jsonDinosaurToTransportTransform
export function jsonDinosaurToTransportTransform(input_?: Dinosaur | null): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    ...jsonDinosaurToTransportDiscriminator(input_),
    size: input_.size,
    kind: input_.kind,
  }!;
}
```

```ts src/models/serializers.ts function jsonTRexToTransportTransform
export function jsonTRexToTransportTransform(input_?: TRex | null): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    kind: input_.kind,
    size: input_.size,
  }!;
}
```

## Deserializer

```ts src/models/serializers.ts function jsonDinosaurToApplicationTransform
export function jsonDinosaurToApplicationTransform(input_?: any): Dinosaur {
  if (!input_) {
    return input_ as any;
  }

  return {
    ...jsonDinosaurToApplicationDiscriminator(input_),
    size: input_.size,
    kind: input_.kind,
  }!;
}
```

```ts src/models/serializers.ts function jsonTRexToApplicationTransform
export function jsonTRexToApplicationTransform(input_?: any): TRex {
  if (!input_) {
    return input_ as any;
  }

  return {
    kind: input_.kind,
    size: input_.size,
  }!;
}
```
