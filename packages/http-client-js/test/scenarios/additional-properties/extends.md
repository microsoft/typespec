# Should generate a model with an additional properties defined as extending a Record

## TypeSpec

Defines a model with Additional Properties modeled as externding a Record

```tsp
namespace Test;

model Widget extends Record<unknown> {
  name: string;
  age: int32;
  optional?: string;
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
  additionalProperties?: Record<string, unknown>;
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
    ...jsonRecordUnknownToTransportTransform(input_.additionalProperties),
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
    additionalProperties: jsonRecordUnknownToApplicationTransform(
      (({ name, age, optional, ...rest }) => rest)(input_),
    ),
    name: input_.name,
    age: input_.age,
    optional: input_.optional,
  }!;
}
```
