# Should handle a discriminated union

## Typespec

```tsp
@service
namespace Test;
@discriminated(#{ envelope: "none", discriminatorPropertyName: "kind" })
union WidgetData {
  kind0: WidgetData0,
  kind1: WidgetData1,
}

model WidgetData0 {
  kind: "kind0";
  fooProp: string;
}

model WidgetData1 {
  kind: "kind1";
  start: utcDateTime;
  end?: utcDateTime;
}

@doc("The model spread Record<WidgetData>")
model SpreadRecordForDiscriminatedUnion {
  @doc("The name property")
  name: string;

  ...Record<WidgetData>;
}

@get
op get(): SpreadRecordForDiscriminatedUnion;

@put
op put(@body body: SpreadRecordForDiscriminatedUnion): void;
```

## Typescript

```ts src/models/internal/serializers.ts function jsonSpreadRecordForDiscriminatedUnionToTransportTransform
export function jsonSpreadRecordForDiscriminatedUnionToTransportTransform(
  input_?: SpreadRecordForDiscriminatedUnion | null,
): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonRecordWidgetDataToTransportTransform(input_.additionalProperties),
    name: input_.name,
  }!;
}
```

```ts src/models/internal/serializers.ts function jsonSpreadRecordForDiscriminatedUnionToApplicationTransform
export function jsonSpreadRecordForDiscriminatedUnionToApplicationTransform(
  input_?: any,
): SpreadRecordForDiscriminatedUnion {
  if (!input_) {
    return input_ as any;
  }
  return {
    additionalProperties: jsonRecordWidgetDataToApplicationTransform(
      (({ name, ...rest }) => rest)(input_),
    ),
    name: input_.name,
  }!;
}
```

```ts src/models/internal/serializers.ts function jsonWidgetDataToTransportTransform
export function jsonWidgetDataToTransportTransform(input_?: WidgetData | null): any {
  if (!input_) {
    return input_ as any;
  }
  return jsonWidgetDataToTransportDiscriminator(input_);
}
```

```ts src/models/internal/serializers.ts function jsonWidgetDataToApplicationDiscriminator
export function jsonWidgetDataToApplicationDiscriminator(input_?: any): WidgetData {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.kind;
  if (discriminatorValue === "kind0") {
    return jsonWidgetData0ToApplicationTransform(input_ as any)!;
  }

  if (discriminatorValue === "kind1") {
    return jsonWidgetData1ToApplicationTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
```

```ts src/models/internal/serializers.ts function jsonWidgetDataToTransportDiscriminator
export function jsonWidgetDataToTransportDiscriminator(input_?: WidgetData): any {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.kind;
  if (discriminatorValue === "kind0") {
    return jsonWidgetData0ToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "kind1") {
    return jsonWidgetData1ToTransportTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
```
