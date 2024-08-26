# Should emit serializer and deserializer correctly for properties with primitive array type

## Typespec

```tsp
model Foo {
  my_values: int32[];
}
```

## TypeScript

Should generate a model `Foo` and also a `fooSerializer` and `fooDeserializer` functions that call the `arraySerializer` internally.

```ts models.ts interface Foo
export interface Foo {
  myValues: number[];
}
```

```ts serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues),
  };
}
```

```ts serializers.ts function fooDeserializer
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

```ts models.ts interface Foo
export interface Foo {
  myValues: Bar[];
}
```

```ts models.ts interface Bar
export interface Bar {
  barValue: string;
}
```

```ts serializers.ts function fooSerializer
export function fooSerializer(item: Foo) {
  return {
    my_values: arraySerializer(item.myValues, barSerializer),
  };
}
```

```ts serializers.ts function fooDeserializer
export function fooDeserializer(item: any) {
  return {
    myValues: arraySerializer(item.my_values, barDeserializer),
  };
}
```
