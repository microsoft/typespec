# Should generate a model with an additional properties defined as spread

## TypeSpec

Defines a model with Additional Properties modeled as spreading a Record

```tsp
namespace Test;

model Widget {
  name: string;
  age: int32;
  optional?: string;
  ...Record<string>;
}
op foo(): Widget;
```

## Models

Should generate a model with name `Widget` with the known properties in the root and an evelop property called `additionalProperties`

```ts src/models/models.ts interface Widget
export interface Widget {
  name: string;
  age: number;
  optional?: string;
  additionalProperties?: Record<string, string>;
}
```

## Serializer

The deserializer flattens the additional property envelope into the root of the payload

```ts src/models/serializers.ts function jsonWidgetToTransportTransform
export function jsonWidgetToTransportTransform(input_?: Widget | null): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    ...jsonRecordStringToTransportTransform(input_.additionalProperties),

    name: input_.name,
    age: input_.age,
    optional: input_.optional,
  }!;
}
```

## Deserializer

Deserializer puts the known properties in the root of the object and creates an additional Properties envelope.

```ts src/models/serializers.ts function jsonWidgetToApplicationTransform
export function jsonWidgetToApplicationTransform(input_?: any): Widget {
  if (!input_) {
    return input_ as any;
  }

  return {
    additionalProperties: jsonRecordStringToApplicationTransform(
      (({ name, age, optional, ...rest }) => rest)(input_),
    ),

    name: input_.name,
    age: input_.age,
    optional: input_.optional,
  }!;
}
```
