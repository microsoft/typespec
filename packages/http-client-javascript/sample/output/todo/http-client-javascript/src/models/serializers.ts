import {
  ApiError,
  InvalidTodoItem,
  InvalidUserResponse,
  NoContentResponse,
  NotFoundResponse,
  Standard4XxResponse,
  Standard5XxResponse,
  TodoFileAttachment,
  TodoItem,
  TodoItemPatch,
  TodoLabelRecord,
  TodoPage,
  TodoUrlAttachment,
  User,
  UserCreatedResponse,
  UserExistsResponse,
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
export function userCreatedResponseToTransport(item: UserCreatedResponse) {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
    statusCode: item.statusCode,
    token: item.token,
  };
}
export function userCreatedResponseToApplication(item: any) {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    password: item.password,
    validated: item.validated,
    statusCode: item.statusCode,
    token: item.token,
  };
}
export function userExistsResponseToTransport(item: UserExistsResponse) {
  return {
    statusCode: item.statusCode,
    code: item.code,
  };
}
export function userExistsResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
    code: item.code,
  };
}
export function apiErrorToTransport(item: ApiError) {
  return {
    code: item.code,
    message: item.message,
  };
}
export function apiErrorToApplication(item: any) {
  return {
    code: item.code,
    message: item.message,
  };
}
export function invalidUserResponseToTransport(item: InvalidUserResponse) {
  return {
    statusCode: item.statusCode,
    code: item.code,
  };
}
export function invalidUserResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
    code: item.code,
  };
}
export function standard4XxResponseToTransport(item: Standard4XxResponse) {
  return {
    statusCode: item.statusCode,
  };
}
export function standard4XxResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
  };
}
export function standard5XxResponseToTransport(item: Standard5XxResponse) {
  return {
    statusCode: item.statusCode,
  };
}
export function standard5XxResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
  };
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
export function invalidTodoItemToTransport(item: InvalidTodoItem) {
  return {
    statusCode: item.statusCode,
  };
}
export function invalidTodoItemToApplication(item: any) {
  return {
    statusCode: item.statusCode,
  };
}
export function notFoundResponseToTransport(item: NotFoundResponse) {
  return {
    statusCode: item.statusCode,
  };
}
export function notFoundResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
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
export function noContentResponseToTransport(item: NoContentResponse) {
  return {
    statusCode: item.statusCode,
  };
}
export function noContentResponseToApplication(item: any) {
  return {
    statusCode: item.statusCode,
  };
}
