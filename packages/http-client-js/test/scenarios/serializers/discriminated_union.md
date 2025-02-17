# Should handle a discriminated union

## Typespec

```tsp
@service
namespace Test;
@discriminator("kind")
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

@get
op get(): WidgetData;

@put
op put(@body body: WidgetData): void;
```

## Typescript

```ts src/models/serializers.ts function jsonWidgetDataToTransportTransform
export function jsonWidgetDataToTransportTransform(input_?: WidgetData | null): any {
  if (!input_) {
    return input_ as any;
  }
  return jsonWidgetDataToTransportDiscriminator(input_);
}
```

```ts src/models/serializers.ts function jsonWidgetDataToApplicationTransform
export function jsonWidgetDataToApplicationTransform(input_?: any): WidgetData {
  if (!input_) {
    return input_ as any;
  }
  return jsonWidgetDataToApplicationDiscriminator(input_);
}
```

```ts src/models/serializers.ts function jsonWidgetDataToTransportDiscriminator
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

```ts src/models/serializers.ts function jsonWidgetDataToApplicationDiscriminator
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
