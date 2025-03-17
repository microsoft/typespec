# Should emit a model property which type is a reference to another Model Property

This way of referencing a model property ends up with a ModelProperty which type is a ModelProperty. This test makes sure we can handle that.

```tsp
namespace Test;

model Foo {
  name: string;
  id: int32;
}

model Bar {
  address: string;
  parentId: Foo.id;
}

op get(...Bar): Bar;
```

## Model

```ts src/models/models.ts interface Bar
export interface Bar {
  address: string;
  parentId: number;
}
```

## Transforms

### To Transport

Should emit a serializer for this model

```ts src/models/serializers.ts function jsonBarToTransportTransform
export function jsonBarToTransportTransform(input_?: Bar | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    address: input_.address,
    parentId: input_.parentId,
  }!;
}
```

Should emit an operation serializer

```ts src/models/serializers.ts
import { Bar } from "./models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if (!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  return new Uint8Array(Buffer.from(base64, "base64"));
}
export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}
export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}
export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}
export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toISOString();
}
export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}
export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}
export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}
export function jsonBarToTransportTransform(input_?: Bar | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    address: input_.address,
    parentId: input_.parentId,
  }!;
}
export function jsonBarToApplicationTransform(input_?: any): Bar {
  if (!input_) {
    return input_ as any;
  }
  return {
    address: input_.address,
    parentId: input_.parentId,
  }!;
}
```

### To Application

Should emit a serializer for this model

```ts src/models/serializers.ts function jsonBarToApplicationTransform
export function jsonBarToApplicationTransform(input_?: any): Bar {
  if (!input_) {
    return input_ as any;
  }
  return {
    address: input_.address,
    parentId: input_.parentId,
  }!;
}
```
