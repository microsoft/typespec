# Should handle a polymorphic Model with 2 discriminators

```tsp
@service
namespace Test;

@discriminator("kind")
model Fish {
  age: int32;
}

@discriminator("sharktype")
model Shark extends Fish {
  kind: "shark";
  sharktype: string;
}

model Salmon extends Fish {
  kind: "salmon";
  friends?: Fish[];
  hate?: Record<Fish>;
  partner?: Fish;
}

model SawShark extends Shark {
  sharktype: "saw";
}

model GoblinShark extends Shark {
  sharktype: "goblin";
}

@get
op getModel(): Fish;
```

## Operation

```ts src/api/testClientOperations.ts function getModel
export async function getModel(
  client: TestClientContext,
  options?: GetModelOptions,
): Promise<Fish> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonFishToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

```ts src/models/serializers.ts
import { Fish, Shark, SawShark, GoblinShark, Salmon } from "./models.js";

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
export function jsonFishToTransportDiscriminator(input_?: Fish): any {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.kind;
  if (discriminatorValue === "shark") {
    return jsonSharkToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "salmon") {
    return jsonSalmonToTransportTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
export function jsonFishToTransportTransform(input_?: Fish | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonFishToTransportDiscriminator(input_),
    age: input_.age,
    kind: input_.kind,
  }!;
}
export function jsonFishToApplicationDiscriminator(input_?: any): Fish {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.kind;
  if (discriminatorValue === "shark") {
    return jsonSharkToApplicationTransform(input_ as any)!;
  }

  if (discriminatorValue === "salmon") {
    return jsonSalmonToApplicationTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
export function jsonFishToApplicationTransform(input_?: any): Fish {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonFishToApplicationDiscriminator(input_),
    age: input_.age,
    kind: input_.kind,
  }!;
}
export function jsonSharkToTransportDiscriminator(input_?: Shark): any {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.sharktype;
  if (discriminatorValue === "saw") {
    return jsonSawSharkToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "goblin") {
    return jsonGoblinSharkToTransportTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
export function jsonSharkToTransportTransform(input_?: Shark | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonSharkToTransportDiscriminator(input_),
    kind: input_.kind,
    sharktype: input_.sharktype,
    age: input_.age,
  }!;
}
export function jsonSharkToApplicationDiscriminator(input_?: any): Shark {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.sharktype;
  if (discriminatorValue === "saw") {
    return jsonSawSharkToApplicationTransform(input_ as any)!;
  }

  if (discriminatorValue === "goblin") {
    return jsonGoblinSharkToApplicationTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
export function jsonSharkToApplicationTransform(input_?: any): Shark {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonSharkToApplicationDiscriminator(input_),
    kind: input_.kind,
    sharktype: input_.sharktype,
    age: input_.age,
  }!;
}
export function jsonSawSharkToTransportTransform(input_?: SawShark | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    sharktype: input_.sharktype,
    kind: input_.kind,
    age: input_.age,
  }!;
}
export function jsonSawSharkToApplicationTransform(input_?: any): SawShark {
  if (!input_) {
    return input_ as any;
  }
  return {
    sharktype: input_.sharktype,
    kind: input_.kind,
    age: input_.age,
  }!;
}
export function jsonGoblinSharkToTransportTransform(input_?: GoblinShark | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    sharktype: input_.sharktype,
    kind: input_.kind,
    age: input_.age,
  }!;
}
export function jsonGoblinSharkToApplicationTransform(input_?: any): GoblinShark {
  if (!input_) {
    return input_ as any;
  }
  return {
    sharktype: input_.sharktype,
    kind: input_.kind,
    age: input_.age,
  }!;
}
export function jsonSalmonToTransportTransform(input_?: Salmon | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    friends: jsonArrayFishToTransportTransform(input_.friends),
    hate: jsonRecordFishToTransportTransform(input_.hate),
    partner: jsonFishToTransportTransform(input_.partner),
    age: input_.age,
  }!;
}
export function jsonSalmonToApplicationTransform(input_?: any): Salmon {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    friends: jsonArrayFishToApplicationTransform(input_.friends),
    hate: jsonRecordFishToApplicationTransform(input_.hate),
    partner: jsonFishToApplicationTransform(input_.partner),
    age: input_.age,
  }!;
}
export function jsonArrayFishToTransportTransform(items_?: Array<Fish> | null): any {
  if (!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonFishToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayFishToApplicationTransform(items_?: any): Array<Fish> {
  if (!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonFishToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonRecordFishToTransportTransform(items_?: Record<string, any> | null): any {
  if (!items_) {
    return items_ as any;
  }

  const _transformedRecord: any = {};

  for (const [key, value] of Object.entries(items_ ?? {})) {
    const transformedItem = jsonFishToTransportTransform(value as any);
    _transformedRecord[key] = transformedItem;
  }

  return _transformedRecord;
}
export function jsonRecordFishToApplicationTransform(items_?: any): Record<string, any> {
  if (!items_) {
    return items_ as any;
  }

  const _transformedRecord: any = {};

  for (const [key, value] of Object.entries(items_ ?? {})) {
    const transformedItem = jsonFishToApplicationTransform(value as any);
    _transformedRecord[key] = transformedItem;
  }

  return _transformedRecord;
}
```
