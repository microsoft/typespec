import {
  File,
  FileAttachmentMultipartRequest,
  Page,
  TodoAttachment,
  TodoItem,
  ToDoItemMultipartRequest,
  TodoItemPatch,
  TodoLabelRecord,
  TodoLabels,
  TodoPage,
  User,
} from "./models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if (!value) {
    return undefined as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  return new Uint8Array(Buffer.from(base64, "base64"));
}
export function encodeUint8Array(
  value: Uint8Array | undefined,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return undefined;
  }
  return Buffer.from(value).toString(encoding);
}
export function dateDeserializer(date?: string): Date | undefined {
  if (!date) {
    return undefined;
  }

  return new Date(date);
}
export function dateRfc7231Deserializer(date?: string): Date | undefined {
  if (!date) {
    return undefined;
  }

  return new Date(date);
}
export function dateRfc3339Serializer(date?: Date): string | undefined {
  if (!date) {
    return undefined;
  }

  return date.toISOString();
}
export function dateRfc7231Serializer(date?: Date): string | undefined {
  if (!date) {
    return undefined;
  }

  return date.toUTCString();
}
export function dateUnixTimestampSerializer(date?: Date): number | undefined {
  if (!date) {
    return undefined;
  }

  return Math.floor(date.getTime() / 1000);
}
export function dateUnixTimestampDeserializer(date?: number): Date | undefined {
  if (!date) {
    return undefined;
  }

  return new Date(date * 1000);
}
export function updatePayloadToTransport(payload: TodoItemPatch) {
  return jsonTodoItemPatchToTransportTransform(payload)!;
}
export function createJsonAttachmentPayloadToTransport(payload: TodoAttachment) {
  return jsonTodoAttachmentToTransportTransform(payload)!;
}
export function createPayloadToTransport(payload: User) {
  return jsonUserToTransportTransform(payload)!;
}

export function jsonUserToTransportTransform(input_?: User): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    id: input_.id,
    username: input_.username,
    email: input_.email,
    password: input_.password,
    validated: input_.validated,
  }!;
}

export function jsonUserToApplicationTransform(input_?: any): User {
  if (!input_) {
    return input_ as any;
  }

  return {
    id: input_.id,
    username: input_.username,
    email: input_.email,
    password: input_.password,
    validated: input_.validated,
  }!;
}

export function jsonPageToTransportTransform(input_?: Page): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    items: jsonArrayTodoAttachmentToTransportTransform(input_.items),
  }!;
}

export function jsonPageToApplicationTransform(input_?: any): Page {
  if (!input_) {
    return input_ as any;
  }

  return {
    items: jsonArrayTodoAttachmentToApplicationTransform(input_.items),
  }!;
}
export function jsonArrayTodoAttachmentToTransportTransform(items_?: Array<TodoAttachment>): any {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoAttachmentToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayTodoAttachmentToApplicationTransform(items_?: any): Array<TodoAttachment> {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoAttachmentToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}

export function jsonTodoAttachmentToTransportTransform(input_?: TodoAttachment): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    filename: input_.filename,
    mediaType: input_.mediaType,
    contents: input_.contents,
  }!;
}

export function jsonTodoAttachmentToApplicationTransform(input_?: any): TodoAttachment {
  if (!input_) {
    return input_ as any;
  }

  return {
    filename: input_.filename,
    mediaType: input_.mediaType,
    contents: input_.contents,
  }!;
}

export function jsonFileAttachmentMultipartRequestToTransportTransform(
  input_?: FileAttachmentMultipartRequest,
): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    contents: jsonFileToTransportTransform(input_.contents),
  }!;
}

export function jsonFileAttachmentMultipartRequestToApplicationTransform(
  input_?: any,
): FileAttachmentMultipartRequest {
  if (!input_) {
    return input_ as any;
  }

  return {
    contents: jsonFileToApplicationTransform(input_.contents),
  }!;
}

export function jsonFileToTransportTransform(input_?: File): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    contentType: input_.contentType,
    filename: input_.filename,
    contents: input_.contents,
  }!;
}

export function jsonFileToApplicationTransform(input_?: any): File {
  if (!input_) {
    return input_ as any;
  }

  return {
    contentType: input_.contentType,
    filename: input_.filename,
    contents: input_.contents,
  }!;
}

export function jsonTodoPageToTransportTransform(input_?: TodoPage): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    items: jsonArrayTodoItemToTransportTransform(input_.items),
    pageSize: input_.pageSize,
    totalSize: input_.totalSize,
    limit: input_.limit,
    offset: input_.offset,
    prevLink: input_.prevLink,
    nextLink: input_.nextLink,
  }!;
}

export function jsonTodoPageToApplicationTransform(input_?: any): TodoPage {
  if (!input_) {
    return input_ as any;
  }

  return {
    items: jsonArrayTodoItemToApplicationTransform(input_.items),
    pageSize: input_.pageSize,
    totalSize: input_.totalSize,
    limit: input_.limit,
    offset: input_.offset,
    prevLink: input_.prevLink,
    nextLink: input_.nextLink,
  }!;
}
export function jsonArrayTodoItemToTransportTransform(items_?: Array<TodoItem>): any {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoItemToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayTodoItemToApplicationTransform(items_?: any): Array<TodoItem> {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoItemToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}

export function jsonTodoItemToTransportTransform(input_?: TodoItem): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    id: input_.id,
    title: input_.title,
    createdBy: input_.createdBy,
    assignedTo: input_.assignedTo,
    description: input_.description,
    status: input_.status,
    createdAt: dateRfc3339Serializer(input_.createdAt),
    updatedAt: dateRfc3339Serializer(input_.updatedAt),
    completedAt: dateRfc3339Serializer(input_.completedAt),
    labels: jsonTodoLabelsToTransportTransform(input_.labels),
    _dummy: input_._dummy,
  }!;
}

export function jsonTodoItemToApplicationTransform(input_?: any): TodoItem {
  if (!input_) {
    return input_ as any;
  }

  return {
    id: input_.id,
    title: input_.title,
    createdBy: input_.createdBy,
    assignedTo: input_.assignedTo,
    description: input_.description,
    status: input_.status,
    createdAt: dateDeserializer(input_.createdAt)!,
    updatedAt: dateDeserializer(input_.updatedAt)!,
    completedAt: dateDeserializer(input_.completedAt)!,
    labels: jsonTodoLabelsToApplicationTransform(input_.labels),
    _dummy: input_._dummy,
  }!;
}
export function jsonTodoLabelsToTransportTransform(input_?: TodoLabels): any {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}

export function jsonTodoLabelsToApplicationTransform(input_?: any): TodoLabels {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
export function jsonArrayStringToTransportTransform(items_?: Array<string>): any {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayStringToApplicationTransform(items_?: any): Array<string> {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}

export function jsonTodoLabelRecordToTransportTransform(input_?: TodoLabelRecord): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    name: input_.name,
    color: input_.color,
  }!;
}

export function jsonTodoLabelRecordToApplicationTransform(input_?: any): TodoLabelRecord {
  if (!input_) {
    return input_ as any;
  }

  return {
    name: input_.name,
    color: input_.color,
  }!;
}
export function jsonArrayTodoLabelRecordToTransportTransform(items_?: Array<TodoLabelRecord>): any {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoLabelRecordToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayTodoLabelRecordToApplicationTransform(
  items_?: any,
): Array<TodoLabelRecord> {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonTodoLabelRecordToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}

export function jsonToDoItemMultipartRequestToTransportTransform(
  input_?: ToDoItemMultipartRequest,
): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    item: jsonTodoItemToTransportTransform(input_.item),
    attachments: jsonArrayHttpPartToTransportTransform(input_.attachments),
  }!;
}

export function jsonToDoItemMultipartRequestToApplicationTransform(
  input_?: any,
): ToDoItemMultipartRequest {
  if (!input_) {
    return input_ as any;
  }

  return {
    item: jsonTodoItemToApplicationTransform(input_.item),
    attachments: jsonArrayHttpPartToApplicationTransform(input_.attachments),
  }!;
}
export function jsonArrayHttpPartToTransportTransform(items_?: Array<File>): any {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonFileToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
export function jsonArrayHttpPartToApplicationTransform(items_?: any): Array<File> {
  if (!items_) {
    return undefined as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonFileToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}

export function jsonTodoItemPatchToTransportTransform(input_?: TodoItemPatch): any {
  if (!input_) {
    return input_ as any;
  }

  return {
    title: input_.title,
    assignedTo: input_.assignedTo,
    description: input_.description,
    status: input_.status,
  }!;
}

export function jsonTodoItemPatchToApplicationTransform(input_?: any): TodoItemPatch {
  if (!input_) {
    return input_ as any;
  }

  return {
    title: input_.title,
    assignedTo: input_.assignedTo,
    description: input_.description,
    status: input_.status,
  }!;
}
