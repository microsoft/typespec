# Should emit serializer and deserializer correctly for properties with primitive Record type

## Typespec

```tsp
model Foo {
  my_values: Record<int32>;
}

op foo(): Foo;
```

## TypeScript

Should generate a model `Foo` and also a `jsonFooToTransportTransform` and `jsonFooToApplicationTransform` functions that call the `recordSerializer` internally.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Record<string, number>;
}
```

```ts src/models/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    my_values: jsonRecordInt32ToTransportTransform(input_.myValues),
  }!;
}
```

```ts src/models/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    myValues: jsonRecordInt32ToApplicationTransform(input_.my_values),
  }!;
}
```

# Should emit serializer and deserializer correctly for properties with complex array type

## Typespec

```tsp
model Bar {
  bar_value: string;
}

model Foo {
  my_values: Record<Bar>;
}

op foo(): Foo | Bar;
```

## TypeScript

Should generate models `Foo` and `Bar` and also a `jsonFooToTransportTransform`, `jsonFooToApplicationTransform`, `barToTransport` and `barToApplication` functions that call the `recordSerializer` passing `barToTransport` or `barDeserialize` as the serialization callback.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Record<string, Bar>;
}
```

```ts src/models/models.ts interface Bar
export interface Bar {
  barValue: string;
}
```

```ts src/models/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    my_values: jsonRecordBarToTransportTransform(input_.myValues),
  }!;
}
```

```ts src/models/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    myValues: jsonRecordBarToApplicationTransform(input_.my_values),
  }!;
}
```
