# Should emit serializer and deserializer correctly for properties with primitive Record type

## Typespec

```tsp
model Foo {
  my_values: Record<int32>;
}
```

## TypeScript

Should generate a model `Foo` and also a `fooSerializer` and `fooDeserializer` functions that call the `recordSerializer` internally.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Record<string, number>;
}
```

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: recordSerializer(item.myValues),
  };
}
```

```ts src/models/serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    myValues: recordSerializer(item.my_values),
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
  my_values: Record<Bar>;
}
```

## TypeScript

Should generate models `Foo` and `Bar` and also a `fooSerializer`, `fooDeserializer`, `barSerializer` and `barDeserializer` functions that call the `recordSerializer` passing `barSerializer` or `barDeserialize` as the serialization callback.

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

```ts src/models/serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: recordSerializer(item.myValues, barSerializer),
  };
}
```

```ts src/models/serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    myValues: recordSerializer(item.my_values, barDeserializer),
  };
}
```
