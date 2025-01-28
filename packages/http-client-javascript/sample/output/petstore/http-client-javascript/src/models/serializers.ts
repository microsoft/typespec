import { Pet, ResponsePage, ResponsePage_2, Toy } from "./models.js";

export function recordSerializer(
  record: Record<string, any>,
  convertFn?: (item: any) => any,
): Record<string, any> {
  const output: Record<string, any> = {};

  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const item = record[key];
      output[key] = convertFn ? convertFn(item) : item;
    }
  }

  return output;
}
export function arraySerializer(items: any[], convertFn?: (item: any) => any): any[] {
  const output: any[] = [];

  for (const item of items) {
    if (convertFn) {
      output.push(convertFn(item));
    } else {
      output.push(item);
    }
  }

  return output;
}
export function dateDeserializer(date: string): Date {
  return new Date(date);
}
export function dateRfc7231Deserializer(date: string): Date {
  return new Date(date);
}
export function dateRfc3339Serializer(date: Date): string {
  return date.toISOString();
}
export function dateRfc7231Serializer(date: Date): string {
  return date.toUTCString();
}
export function dateUnixTimestampSerializer(date: Date): number {
  return date.getTime();
}
export function dateUnixTimestampDeserializer(date: number): Date {
  return new Date(date * 1000);
}
export function createPayloadToTransport(payload: Pet) {
  return createPayloadToTransport(payload);
}
export function responsePageToTransport(item: ResponsePage): any {
  return {
    items: arraySerializer(item.items, createPayloadToTransport),
    nextLink: item.nextLink,
  };
}
export function responsePageToApplication(item: any): ResponsePage {
  return {
    items: arraySerializer(item.items, petToApplication),
    nextLink: item.nextLink,
  };
}
export function petToTransport(item: Pet): any {
  return {
    name: item.name,
    tag: item.tag,
    age: item.age,
  };
}
export function petToApplication(item: any): Pet {
  return {
    name: item.name,
    tag: item.tag,
    age: item.age,
  };
}
export function responsePageToTransport_2(item: ResponsePage_2): any {
  return {
    items: arraySerializer(item.items, toyToTransport),
    nextLink: item.nextLink,
  };
}
export function responsePageToApplication_2(item: any): ResponsePage_2 {
  return {
    items: arraySerializer(item.items, toyToApplication),
    nextLink: item.nextLink,
  };
}
export function toyToTransport(item: Toy): any {
  return {
    id: item.id,
    petId: item.petId,
    name: item.name,
  };
}
export function toyToApplication(item: any): Toy {
  return {
    id: item.id,
    petId: item.petId,
    name: item.name,
  };
}
