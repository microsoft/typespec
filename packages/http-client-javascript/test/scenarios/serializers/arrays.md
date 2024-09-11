# Should emit serializer and deserializer correctly for properties with primitive array type

## Typespec

```tsp
model Foo {
  my_values: int32[];
}
op foo(): Foo;
```

## TypeScript

Should generate a model `Foo` and also a `fooToTransport` and `fooToApplication` functions that call the `arraySerializer` internally.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: number[];
}
```

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues),
  };
}
```

```ts src/models/serializers.ts function fooToApplication
export function fooToApplication(item: any) {
  return {
    myValues: arraySerializer(item.my_values),
  };
}
```

# Should emit serializer and deserializer correctly for properties with complex array type

## Typespec

```tsp
model Bar {
  bar_value: string;
}

model Foo {
  my_values: Bar[];
}
op foo(): Foo;
```

## TypeScript

Should generate models `Foo` and `Bar` and also a `fooToTransport`, `fooToApplication`, `barToTransport` and `barToApplication` functions that call the `arraySerializer` passing `barToTransport` or `barDeserialize` as the serialization callback.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Bar[];
}
```

```ts src/models/models.ts interface Bar
export interface Bar {
  barValue: string;
}
```

```ts src/models/serializers.ts function fooToTransport
export function fooToTransport(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues, barToTransport),
  };
}
```

```ts src/models/serializers.ts function fooToApplication
export function fooToApplication(item: any) {
  return {
    myValues: arraySerializer(item.my_values, barToApplication),
  };
}
```
