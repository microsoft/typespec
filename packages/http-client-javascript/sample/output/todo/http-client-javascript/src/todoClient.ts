import { KeyCredential } from "@typespec/ts-http-runtime";
import {
  AttachmentsClientContext,
  createAttachmentsClientContext,
} from "./api/attachmentsClient/clientContext.js";
import { createAttachment, list as list_2 } from "./api/attachmentsClient/operations.js";
import { TodoClientContext, createTodoClientContext } from "./api/clientContext.js";
import {
  TodoItemsClientContext,
  createTodoItemsClientContext,
} from "./api/todoItemsClient/clientContext.js";
import { create, delete_, get, list, update } from "./api/todoItemsClient/operations.js";
import { UsersClientContext, createUsersClientContext } from "./api/usersClient/clientContext.js";
import { create as create_2 } from "./api/usersClient/operations.js";
import { TodoAttachment, TodoItem, TodoItemPatch, User } from "./models/models.js";

export class TodoClient {
  #context: TodoClientContext;
  usersClient: UsersClient;
  todoItemsClient: TodoItemsClient;
  constructor(endpoint: string, credential: KeyCredential | KeyCredential) {
    this.#context = createTodoClientContext(endpoint, credential);
    this.usersClient = new UsersClient(endpoint);
    this.todoItemsClient = new TodoItemsClient(endpoint);
  }
}

export class TodoItemsClient {
  #context: TodoItemsClientContext;
  attachmentsClient: AttachmentsClient;
  constructor(endpoint: string) {
    this.#context = createTodoItemsClientContext(endpoint);
    this.attachmentsClient = new AttachmentsClient(endpoint);
  }
  async list(options?: { limit?: number; offset?: number }) {
    return list(this.#context, options);
  }
  async create(
    item: TodoItem,
    contentType: "application/json",
    options?: {
      attachments?: Array<TodoAttachment>;
    },
  ) {
    return create(this.#context, item, contentType, options);
  }
  async get(id: number) {
    return get(this.#context, id);
  }
  async update(id: number, patch: TodoItemPatch, contentType: "application/merge-patch+json") {
    return update(this.#context, id, patch, contentType);
  }
  async delete(id: number) {
    return delete_(this.#context, id);
  }
}

export class AttachmentsClient {
  #context: AttachmentsClientContext;

  constructor(endpoint: string) {
    this.#context = createAttachmentsClientContext(endpoint);
  }
  async list(itemId: number) {
    return list_2(this.#context, itemId);
  }
  async createAttachment(itemId: number, contents: TodoAttachment) {
    return createAttachment(this.#context, itemId, contents);
  }
}

export class UsersClient {
  #context: UsersClientContext;

  constructor(endpoint: string) {
    this.#context = createUsersClientContext(endpoint);
  }
  async create(user: User) {
    return create_2(this.#context, user);
  }
}
