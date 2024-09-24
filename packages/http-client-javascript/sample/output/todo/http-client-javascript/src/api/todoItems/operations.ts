import { parse } from "uri-template";
import {
  TodoAttachment,
  TodoItem,
  TodoItemPatch,
  TodoLabels,
  TodoPage,
} from "../../models/models.js";
import {
  arraySerializer,
  dateDeserializer,
  todoItemPatchToTransport,
  todoItemToTransport,
  todoPageToApplication,
} from "../../models/serializers.js";
import { httpFetch } from "../../utilities/http-fetch.js";
import { TodoContext } from "../clientContext.js";

export async function list(
  client: TodoContext,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<TodoPage> {
  const path = parse("/items{?limit,offset}").expand({
    limit: options?.limit,
    offset: options?.offset,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return todoPageToApplication(bodyJson);
  }

  throw new Error("Unhandled response");
}

export async function create(
  client: TodoContext,
  item: TodoItem,
  contentType: "application/json",
  options?: {
    attachments?: TodoAttachment[];
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

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "post",
    headers: {
      "Content-Type": contentType,
    },
    body: JSON.stringify({
      item: todoItemToTransport(item),
      attachments: options?.attachments
        ? arraySerializer(options?.attachments)
        : options?.attachments,
    }),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return {
      id: bodyJson.id,
      title: bodyJson.title,
      createdBy: bodyJson.createdBy,
      assignedTo: bodyJson.assignedTo,
      description: bodyJson.description,
      status: bodyJson.status,
      createdAt: dateDeserializer(bodyJson.createdAt),
      updatedAt: dateDeserializer(bodyJson.updatedAt),
      completedAt: bodyJson.completedAt
        ? dateDeserializer(bodyJson.completedAt)
        : bodyJson.completedAt,
      labels: bodyJson.labels,
    };
  }

  throw new Error("Unhandled response");
}

export async function get(
  client: TodoContext,
  id: number,
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
} | void> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "get",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return {
      id: bodyJson.id,
      title: bodyJson.title,
      createdBy: bodyJson.createdBy,
      assignedTo: bodyJson.assignedTo,
      description: bodyJson.description,
      status: bodyJson.status,
      createdAt: dateDeserializer(bodyJson.createdAt),
      updatedAt: dateDeserializer(bodyJson.updatedAt),
      completedAt: bodyJson.completedAt
        ? dateDeserializer(bodyJson.completedAt)
        : bodyJson.completedAt,
      labels: bodyJson.labels,
    };
  }

  if (response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}

export async function update(
  client: TodoContext,
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

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "patch",
    headers: {
      "Content-Type": contentType,
    },
    body: JSON.stringify(todoItemPatchToTransport(patch)),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 200) {
    const bodyJson = await response.json();
    return {
      id: bodyJson.id,
      title: bodyJson.title,
      createdBy: bodyJson.createdBy,
      assignedTo: bodyJson.assignedTo,
      description: bodyJson.description,
      status: bodyJson.status,
      createdAt: dateDeserializer(bodyJson.createdAt),
      updatedAt: dateDeserializer(bodyJson.updatedAt),
      completedAt: bodyJson.completedAt
        ? dateDeserializer(bodyJson.completedAt)
        : bodyJson.completedAt,
      labels: bodyJson.labels,
    };
  }

  throw new Error("Unhandled response");
}

export async function delete_(client: TodoContext, id: number): Promise<void> {
  const path = parse("/items/{id}").expand({
    id: id,
  });

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "delete",
    headers: {},
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 204 && !response.body) {
    return;
  }

  if (response.status === 404 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
