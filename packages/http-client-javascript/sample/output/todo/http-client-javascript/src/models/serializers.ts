import { createFilePartDescriptor } from "../helpers/multipart-helpers.js";
import {
  File,
  FileAttachmentMultipartRequest,
  Page,
  TodoAttachment,
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
export function createFormPayloadToTransport(payload: ToDoItemMultipartRequest) {
  return [
    {
      name: "item",
      body: {
        title: payload.item.title,
        assignedTo: payload.item.assignedTo,
        description: payload.item.description,
        status: payload.item.status,
        labels: payload.item.labels,
        _dummy: payload.item._dummy,
      },
    },
    ...(payload.attachments ?? []).map((x: any) => createFilePartDescriptor("attachments", x)),
  ];
}
export function updatePayloadToTransport(payload: TodoItemPatch) {
  return updatePayloadToTransport(payload);
}
export function createJsonAttachmentPayloadToTransport(payload: TodoAttachment) {
  return createJsonAttachmentPayloadToTransport(payload);
}
export function createFileAttachmentPayloadToTransport(payload: FileAttachmentMultipartRequest) {
  return [createFilePartDescriptor("contents", payload)];
}
export function createPayloadToTransport(payload: User) {
  return createPayloadToTransport(payload);
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
export function pageToTransport(item: Page): any {
  return {
    items: arraySerializer(item.items, createJsonAttachmentPayloadToTransport),
  };
}
export function pageToApplication(item: any): Page {
  return {
    items: arraySerializer(item.items, todoAttachmentToApplication),
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
export function fileAttachmentMultipartRequestToTransport(
  item: FileAttachmentMultipartRequest,
): any {
  return {
    contents: fileToTransport(item.contents),
  };
}
export function fileAttachmentMultipartRequestToApplication(
  item: any,
): FileAttachmentMultipartRequest {
  return {
    contents: fileToApplication(item.contents),
  };
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
export function toDoItemMultipartRequestToTransport(item: ToDoItemMultipartRequest): any {
  return {
    item: todoItemToTransport(item.item),
    attachments: item.attachments
      ? arraySerializer(item.attachments, fileToTransport)
      : item.attachments,
  };
}
export function toDoItemMultipartRequestToApplication(item: any): ToDoItemMultipartRequest {
  return {
    item: todoItemToApplication(item.item),
    attachments: item.attachments
      ? arraySerializer(item.attachments, fileToApplication)
      : item.attachments,
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
