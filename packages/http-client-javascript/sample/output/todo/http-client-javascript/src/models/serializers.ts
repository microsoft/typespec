import {
  AttachmentPage,
  TodoFileAttachment,
  TodoItem,
  TodoItemPatch,
  TodoLabelRecord,
  TodoPage,
  TodoUrlAttachment,
  User,
} from "./models.js";

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
export function todoPageToTransport(item: TodoPage) {
  return {
    items: arraySerializer(item.items, todoItemToTransport),
    pagination: {
      pageSize: item.pagination.pageSize,
      totalSize: item.pagination.totalSize,
      limit: item.pagination.limit,
      offset: item.pagination.offset,
      prevLink: item.pagination.prevLink,
      nextLink: item.pagination.nextLink,
    },
  };
}
export function todoPageToApplication(item: any) {
  return {
    items: arraySerializer(item.items, todoItemToApplication),
    pagination: {
      pageSize: item.pagination.pageSize,
      totalSize: item.pagination.totalSize,
      limit: item.pagination.limit,
      offset: item.pagination.offset,
      prevLink: item.pagination.prevLink,
      nextLink: item.pagination.nextLink,
    },
  };
}
export function todoItemToTransport(item: TodoItem) {
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
export function todoItemToApplication(item: any) {
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
export function todoLabelRecordToTransport(item: TodoLabelRecord) {
  return {
    name: item.name,
    color: item.color,
  };
}
export function todoLabelRecordToApplication(item: any) {
  return {
    name: item.name,
    color: item.color,
  };
}
export function todoFileAttachmentToTransport(item: TodoFileAttachment) {
  return {
    filename: item.filename,
    mediaType: item.mediaType,
    contents: item.contents,
  };
}
export function todoFileAttachmentToApplication(item: any) {
  return {
    filename: item.filename,
    mediaType: item.mediaType,
    contents: item.contents,
  };
}
export function todoUrlAttachmentToTransport(item: TodoUrlAttachment) {
  return {
    description: item.description,
    url: item.url,
  };
}
export function todoUrlAttachmentToApplication(item: any) {
  return {
    description: item.description,
    url: item.url,
  };
}
export function todoItemPatchToTransport(item: TodoItemPatch) {
  return {
    title: item.title,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
  };
}
export function todoItemPatchToApplication(item: any) {
  return {
    title: item.title,
    assignedTo: item.assignedTo,
    description: item.description,
    status: item.status,
  };
}
export function attachmentPageToTransport(item: AttachmentPage) {
  return {
    items: arraySerializer(item.items),
    pagination: {
      pageSize: item.pagination.pageSize,
      totalSize: item.pagination.totalSize,
      limit: item.pagination.limit,
      offset: item.pagination.offset,
      prevLink: item.pagination.prevLink,
      nextLink: item.pagination.nextLink,
    },
  };
}
export function attachmentPageToApplication(item: any) {
  return {
    items: arraySerializer(item.items),
    pagination: {
      pageSize: item.pagination.pageSize,
      totalSize: item.pagination.totalSize,
      limit: item.pagination.limit,
      offset: item.pagination.offset,
      prevLink: item.pagination.prevLink,
      nextLink: item.pagination.nextLink,
    },
  };
}
export function userToTransport(item: User) {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
  };
}
export function userToApplication(item: any) {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
  };
}
