import { createFilePartDescriptor } from "../helpers/multipart-helpers.js";
import {
  ConstructorParameters,
  ConstructorParameters_2,
  ConstructorParameters_3,
  ConstructorParameters_4,
  File,
  FileAttachmentMultipartRequest,
  TodoAttachment,
  TodoAttachmentPage,
  TodoItem,
  ToDoItemMultipartRequest,
  TodoItemPatch,
  TodoLabelRecord,
  TodoPage,
  User,
} from "./models.js";

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
export function constructorParametersToTransport(item: ConstructorParameters): any {
  return {
    endpoint: item.endpoint,
    credential: item.credential,
  };
}
export function constructorParametersToApplication(item: any): ConstructorParameters {
  return {
    endpoint: item.endpoint,
    credential: item.credential,
  };
}
export function constructorParametersToTransport_2(item: ConstructorParameters_2): any {
  return {
    endpoint: item.endpoint,
  };
}
export function constructorParametersToApplication_2(item: any): ConstructorParameters_2 {
  return {
    endpoint: item.endpoint,
  };
}
export function constructorParametersToTransport_3(item: ConstructorParameters_3): any {
  return {
    endpoint: item.endpoint,
  };
}
export function constructorParametersToApplication_3(item: any): ConstructorParameters_3 {
  return {
    endpoint: item.endpoint,
  };
}
export function constructorParametersToTransport_4(item: ConstructorParameters_4): any {
  return {
    endpoint: item.endpoint,
    credential: item.credential,
  };
}
export function constructorParametersToApplication_4(item: any): ConstructorParameters_4 {
  return {
    endpoint: item.endpoint,
    credential: item.credential,
  };
}
export function todoPageToTransport(item: TodoPage): any {
  return {
    items: arraySerializer(item.items, todoItemToTransport),
    pageSize: item.pageSize,
    totalSize: item.totalSize,
    limit: item.limit,
    offset: item.offset,
    prevLink: item.prevLink,
    nextLink: item.nextLink,
  };
}
export function todoPageToApplication(item: any): TodoPage {
  return {
    items: arraySerializer(item.items, todoItemToApplication),
    pageSize: item.pageSize,
    totalSize: item.totalSize,
    limit: item.limit,
    offset: item.offset,
    prevLink: item.prevLink,
    nextLink: item.nextLink,
  };
}
export function todoItemToTransport(item: TodoItem): any {
  return {
    id: item.id,
    title: item.title,
    createdBy: item.createdBy,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
    createdAt: dateRfc3339Serializer(item.createdAt),
    updatedAt: dateRfc3339Serializer(item.updatedAt),
    completedAt: item.completedAt ? dateRfc3339Serializer(item.completedAt) : item.completedAt,
    labels: item.labels,
    _dummy: item._dummy,
  };
}
export function todoItemToApplication(item: any): TodoItem {
  return {
    id: item.id,
    title: item.title,
    createdBy: item.createdBy,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
    createdAt: dateDeserializer(item.createdAt),
    updatedAt: dateDeserializer(item.updatedAt),
    completedAt: item.completedAt ? dateDeserializer(item.completedAt) : item.completedAt,
    labels: item.labels,
    _dummy: item._dummy,
  };
}
export function todoLabelRecordToTransport(item: TodoLabelRecord): any {
  return {
    name: item.name,
    color: item.color,
  };
}
export function todoLabelRecordToApplication(item: any): TodoLabelRecord {
  return {
    name: item.name,
    color: item.color,
  };
}
export function todoAttachmentToTransport(item: TodoAttachment): any {
  return {
    filename: item.filename,
    mediaType: item.mediaType,
    contents: item.contents,
  };
}
export function todoAttachmentToApplication(item: any): TodoAttachment {
  return {
    filename: item.filename,
    mediaType: item.mediaType,
    contents: item.contents,
  };
}
export function toDoItemMultipartRequestToTransport(item: ToDoItemMultipartRequest): any {
  return [
    {
      name: "item",
      body: todoItemToTransport(item.item),
    },
    ...(item.attachments ?? []).map((x: any) => createFilePartDescriptor("attachments", x)),
  ];
}
export function toDoItemMultipartRequestToApplication(item: any): any {
  return [
    {
      name: "item",
      body: todoItemToApplication(item.item),
    },
    ...(item.attachments ?? []).map((x: any) => createFilePartDescriptor("attachments", x)),
  ];
}
export function fileToTransport(item: File): any {
  return {
    contentType: item.contentType,
    filename: item.filename,
    contents: item.contents,
  };
}
export function fileToApplication(item: any): File {
  return {
    contentType: item.contentType,
    filename: item.filename,
    contents: item.contents,
  };
}
export function todoItemPatchToTransport(item: TodoItemPatch): any {
  return {
    title: item.title,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
  };
}
export function todoItemPatchToApplication(item: any): TodoItemPatch {
  return {
    title: item.title,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
  };
}
export function todoAttachmentPageToTransport(item: TodoAttachmentPage): any {
  return {
    items: arraySerializer(item.items, todoAttachmentToTransport),
  };
}
export function todoAttachmentPageToApplication(item: any): TodoAttachmentPage {
  return {
    items: arraySerializer(item.items, todoAttachmentToApplication),
  };
}
export function fileAttachmentMultipartRequestToTransport(
  item: FileAttachmentMultipartRequest,
): any {
  return [createFilePartDescriptor("contents", item.contents)];
}
export function fileAttachmentMultipartRequestToApplication(item: any): any {
  return [createFilePartDescriptor("contents", item.contents)];
}
export function userToTransport(item: User): any {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
  };
}
export function userToApplication(item: any): User {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
  };
}
