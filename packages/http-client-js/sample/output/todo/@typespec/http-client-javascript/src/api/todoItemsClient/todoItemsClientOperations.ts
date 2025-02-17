import { parse } from "uri-template";
import { OperationOptions } from "../../helpers/interfaces.js";
import { createFilePartDescriptor } from "../../helpers/multipart-helpers.js";
import {
  TodoAttachment,
  TodoItem,
  ToDoItemMultipartRequest,
  TodoItemPatch,
  TodoLabels,
  TodoPage,
} from "../../models/models.js";
import {
  dateDeserializer,
  jsonArrayTodoAttachmentToTransportTransform,
  jsonTodoItemPatchToTransportTransform,
  jsonTodoItemToTransportTransform,
  jsonTodoLabelsToApplicationTransform,
  jsonTodoLabelsToTransportTransform,
  jsonTodoPageToApplicationTransform,
} from "../../models/serializers.js";
import { TodoItemsClientContext } from "./todoItemsClientContext.js";

export interface ListOptions extends OperationOptions {
  limit?: number;
  offset?: number;
}
export async function list(
  client: TodoItemsClientContext,
  options?: ListOptions,
): Promise<TodoPage> {
  const path = parse("/items{?limit,offset}").expand({
    limit: options?.limit ?? 50,
    offset: options?.offset,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonTodoPageToApplicationTransform(response.body)!;
  }

  throw new Error("Unhandled response");
}
export interface CreateJsonOptions extends OperationOptions {
  contentType?: "application/json";
  assignedTo?: number;
  description?: string;
  labels?: TodoLabels;
  _dummy?: string;
  attachments?: Array<TodoAttachment>;
}
export async function createJson(
  client: TodoItemsClientContext,
  item: TodoItem,
  options?: CreateJsonOptions,
): Promise<{
  id: number;
  title: string;
  createdBy: number;
  assignedTo?: number;
  description?: string;
  status: "NotStarted" | "InProgress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  labels?: TodoLabels;
}> {
  const path = parse("/items").expand({});

  const httpRequestOptions = {
    headers: {
      contentType: options?.contentType ?? "application/json",
    },
    body: {
      item: jsonTodoItemToTransportTransform(item),
      attachments: jsonArrayTodoAttachmentToTransportTransform(options?.attachments),
    },
  };

  const response = await client.path(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt)!,
      updatedAt: dateDeserializer(response.body.updatedAt)!,
      completedAt: dateDeserializer(response.body.completedAt)!,
      labels: jsonTodoLabelsToApplicationTransform(response.body.labels),
    }!;
  }

  throw new Error("Unhandled response");
}
export interface CreateFormOptions extends OperationOptions {
  contentType?: "multipart/form-data";
}
export async function createForm(
  client: TodoItemsClientContext,
  body: ToDoItemMultipartRequest,
  options?: CreateFormOptions,
): Promise<{
  id: number;
  title: string;
  createdBy: number;
  assignedTo?: number;
  description?: string;
  status: "NotStarted" | "InProgress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  labels?: TodoLabels;
}> {
  const path = parse("/items").expand({});

  const httpRequestOptions = {
    headers: {
      contentType: options?.contentType ?? "multipart/form-data",
    },
    body: [
      {
        name: "item",
        body: {
          title: body.item.title,
          assignedTo: body.item.assignedTo,
          description: body.item.description,
          status: body.item.status,
          labels: jsonTodoLabelsToTransportTransform(body.item.labels),
          _dummy: body.item._dummy,
        },
      },
      ...(body.attachments ?? []).map((attachments: any) =>
        createFilePartDescriptor("attachments", attachments),
      ),
    ],
  };

  const response = await client.path(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt)!,
      updatedAt: dateDeserializer(response.body.updatedAt)!,
      completedAt: dateDeserializer(response.body.completedAt)!,
      labels: jsonTodoLabelsToApplicationTransform(response.body.labels),
    }!;
  }

  throw new Error("Unhandled response");
}
export interface GetOptions extends OperationOptions {}
export async function get(
  client: TodoItemsClientContext,
  id: number,
  options?: GetOptions,
): Promise<{
  id: number;
  title: string;
  createdBy: number;
  assignedTo?: number;
  description?: string;
  status: "NotStarted" | "InProgress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  labels?: TodoLabels;
}> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt)!,
      updatedAt: dateDeserializer(response.body.updatedAt)!,
      completedAt: dateDeserializer(response.body.completedAt)!,
      labels: jsonTodoLabelsToApplicationTransform(response.body.labels),
    }!;
  }

  throw new Error("Unhandled response");
}
export interface UpdateOptions extends OperationOptions {
  contentType?: "application/merge-patch+json";
}
export async function update(
  client: TodoItemsClientContext,
  id: number,
  patch: TodoItemPatch,
  options?: UpdateOptions,
): Promise<{
  id: number;
  title: string;
  createdBy: number;
  assignedTo?: number;
  description?: string;
  status: "NotStarted" | "InProgress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  labels?: TodoLabels;
}> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {
      contentType: options?.contentType ?? "application/merge-patch+json",
    },
    body: jsonTodoItemPatchToTransportTransform(patch),
  };

  const response = await client.path(path).patch(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt)!,
      updatedAt: dateDeserializer(response.body.updatedAt)!,
      completedAt: dateDeserializer(response.body.completedAt)!,
      labels: jsonTodoLabelsToApplicationTransform(response.body.labels),
    }!;
  }

  throw new Error("Unhandled response");
}
export interface DeleteOptions extends OperationOptions {}
export async function delete_(
  client: TodoItemsClientContext,
  id: number,
  options?: DeleteOptions,
): Promise<void> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).delete(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
