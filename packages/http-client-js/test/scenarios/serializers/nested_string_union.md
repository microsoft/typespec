# Nested named string unions with scalar variants

Every string branch passes through unchanged, regardless of where the scalar appears. Nullable values retain the existing null/undefined guard.

## TypeSpec

```tsp
@service
@server(
  "{endpoint}",
  "",
  {
    endpoint: url,
  }
)
namespace Test;

union A {
  a1: "a=1",
  a2: "a=2",
}
union B {
  b1: "b=1",
  b2: "b=2",
}
@pattern("^t=.+$")
scalar T extends string;
union AB {
  A,
  T,
  B,
}
union ScalarFirst {
  T,
  A,
  B,
}
union NullableAB {
  A,
  T,
  B,
  null,
}

model Payload {
  value: AB;
  scalarFirst: ScalarFirst;
}

@route("/read") @get op read(@header("Prefer") prefer?: AB[]): void;
@route("/roundtrip") @post op roundtrip(@body body: Payload): Payload;
@route("/nullable") @post op nullable(@body body: NullableAB): NullableAB;
```

## Transport transforms

```ts src/models/internal/serializers.ts function jsonAbToTransportTransform
export function jsonAbToTransportTransform(input_?: Ab | null): any {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```

```ts src/models/internal/serializers.ts function jsonScalarFirstToTransportTransform
export function jsonScalarFirstToTransportTransform(input_?: ScalarFirst | null): any {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```

```ts src/models/internal/serializers.ts function jsonNullableAbToTransportTransform
export function jsonNullableAbToTransportTransform(input_?: NullableAb | null): any {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```

## Application transforms

```ts src/models/internal/serializers.ts function jsonAbToApplicationTransform
export function jsonAbToApplicationTransform(input_?: any): Ab {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```

```ts src/models/internal/serializers.ts function jsonNullableAbToApplicationTransform
export function jsonNullableAbToApplicationTransform(input_?: any): NullableAb {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```
