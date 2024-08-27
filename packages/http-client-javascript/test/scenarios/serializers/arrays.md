# Should emit serializer and deserializer correctly for properties with primitive array type

## Typespec

```tsp
model Foo {
  my_values: int32[];
}
```

## TypeScript

Should generate a model `Foo` and also a `fooSerializer` and `fooDeserializer` functions that call the `arraySerializer` internally.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: number[];
}
```

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues),
  };
}
```

```ts src/models/serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
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
```

## TypeScript

Should generate models `Foo` and `Bar` and also a `fooSerializer`, `fooDeserializer`, `barSerializer` and `barDeserializer` functions that call the `arraySerializer` passing `barSerializer` or `barDeserialize` as the serialization callback.

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

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues, barSerializer),
  };
}
```

```ts src/models/serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    myValues: arraySerializer(item.my_values, barDeserializer),
  };
}
```
