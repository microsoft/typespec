import { parse } from "uri-template";
import {
  TodoAttachment,
  TodoItem,
  ToDoItemMultipartRequest,
  TodoItemPatch,
  TodoLabels,
  TodoPage,
} from "../../models/models.js";
import {
  arraySerializer,
  dateDeserializer,
  todoAttachmentToTransport,
  toDoItemMultipartRequestToTransport,
  todoItemPatchToTransport,
  todoItemToTransport,
  todoPageToApplication,
} from "../../models/serializers.js";
import { TodoItemsClientContext } from "./clientContext.js";

export async function list(
  client: TodoItemsClientContext,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<TodoPage> {
  const path = parse("/items{?limit,offset}").expand({
    limit: options?.limit,
    offset: options?.offset,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return todoPageToApplication(response.body);
  }

  throw new Error("Unhandled response");
}
export async function createJson(
  client: TodoItemsClientContext,
  item: TodoItem,
  contentType: "application/json",
  options?: {
    attachments?: Array<TodoAttachment>;
  },
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
      "Content-Type": contentType,
    },
    body: {
      item: todoItemToTransport(item),
      attachments: options?.attachments
        ? arraySerializer(options?.attachments, todoAttachmentToTransport)
        : options?.attachments,
    },
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 200) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt),
      updatedAt: dateDeserializer(response.body.updatedAt),
      completedAt: response.body.completedAt
        ? dateDeserializer(response.body.completedAt)
        : response.body.completedAt,
      labels: response.body.labels,
    };
  }

  throw new Error("Unhandled response");
}
export async function createForm(
  client: TodoItemsClientContext,
  body: ToDoItemMultipartRequest,
  contentType: "multipart/form-data",
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
      "Content-Type": contentType,
    },
    body: {
      body: toDoItemMultipartRequestToTransport(body),
    },
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 200) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt),
      updatedAt: dateDeserializer(response.body.updatedAt),
      completedAt: response.body.completedAt
        ? dateDeserializer(response.body.completedAt)
        : response.body.completedAt,
      labels: response.body.labels,
    };
  }

  throw new Error("Unhandled response");
}
export async function get(
  client: TodoItemsClientContext,
  id: number,
): Promise<
  | {
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
    }
  | {
      code: "not-found";
    }
> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 200) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt),
      updatedAt: dateDeserializer(response.body.updatedAt),
      completedAt: response.body.completedAt
        ? dateDeserializer(response.body.completedAt)
        : response.body.completedAt,
      labels: response.body.labels,
    };
  }

  if (+response.status === 200) {
    return {
      code: response.body.code,
    };
  }

  throw new Error("Unhandled response");
}
export async function update(
  client: TodoItemsClientContext,
  id: number,
  patch: TodoItemPatch,
  contentType: "application/merge-patch+json",
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
      "Content-Type": contentType,
    },
    body: todoItemPatchToTransport(patch),
  };

  const response = await client.path(path).patch(httpRequestOptions);
  if (+response.status === 200) {
    return {
      id: response.body.id,
      title: response.body.title,
      createdBy: response.body.createdBy,
      assignedTo: response.body.assignedTo,
      description: response.body.description,
      status: response.body.status,
      createdAt: dateDeserializer(response.body.createdAt),
      updatedAt: dateDeserializer(response.body.updatedAt),
      completedAt: response.body.completedAt
        ? dateDeserializer(response.body.completedAt)
        : response.body.completedAt,
      labels: response.body.labels,
    };
  }

  throw new Error("Unhandled response");
}
export async function delete_(
  client: TodoItemsClientContext,
  id: number,
): Promise<void | {
  code: "not-found";
}> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).delete(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return response.body;
  }

  if (+response.status === 200) {
    return {
      code: response.body.code,
    };
  }

  throw new Error("Unhandled response");
}
