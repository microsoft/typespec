import { Error, OkResponse, Pet, PetResponsePage, Toy, ToyResponsePage } from "./models.js";

export function recordSerializer(
  record: Record<string, any>,
  convertFn: (item: any) => any,
): Record<string, any> {
  const output: Record<string, any> = {};

  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const item = record[key];
      output[key] = convertFn(item);
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
export function okResponseToTransport(item: OkResponse) {
  return {
    statusCode: item.statusCode,
  };
}
export function okResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
  };
}
export function errorToTransport(item: Error) {
  return {
    code: item.code,
    message: item.message,
  };
}
export function errorToApplication(item: any) {
  return {
    code: item.code,
    message: item.message,
  };
}
export function petResponsePageToTransport(item: PetResponsePage) {
  return {
    items: arraySerializer(item.items, petToTransport),
    nextLink: item.nextLink,
  };
}
export function petResponsePageToApplication(item: any) {
  return {
    items: arraySerializer(item.items, petToApplication),
    nextLink: item.nextLink,
  };
}
export function petToTransport(item: Pet) {
  return {
    name: item.name,
    tag: item.tag,
    age: item.age,
  };
}
export function petToApplication(item: any) {
  return {
    name: item.name,
    tag: item.tag,
    age: item.age,
  };
}
export function toyResponsePageToTransport(item: ToyResponsePage) {
  return {
    items: arraySerializer(item.items, toyToTransport),
    nextLink: item.nextLink,
  };
}
export function toyResponsePageToApplication(item: any) {
  return {
    items: arraySerializer(item.items, toyToApplication),
    nextLink: item.nextLink,
  };
}
export function toyToTransport(item: Toy) {
  return {
    id: item.id,
    petId: item.petId,
    name: item.name,
  };
}
export function toyToApplication(item: any) {
  return {
    id: item.id,
    petId: item.petId,
    name: item.name,
  };
}
