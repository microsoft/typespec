import { KeyCredential } from "@typespec/ts-http-runtime";
import {
  TodoClientContext,
  TodoClientOptions,
  createTodoClientContext,
} from "./api/clientContext.js";
import {
  AttachmentsClientContext,
  AttachmentsClientOptions,
  createAttachmentsClientContext,
} from "./api/todoItemsClient/attachmentsClient/clientContext.js";
import {
  createAttachment,
  list as list_2,
} from "./api/todoItemsClient/attachmentsClient/operations.js";
import {
  TodoItemsClientContext,
  TodoItemsClientOptions,
  createTodoItemsClientContext,
} from "./api/todoItemsClient/clientContext.js";
import {
  create as create_2,
  delete_,
  get,
  list,
  update,
} from "./api/todoItemsClient/operations.js";
import {
  UsersClientContext,
  UsersClientOptions,
  createUsersClientContext,
} from "./api/usersClient/clientContext.js";
import { create } from "./api/usersClient/operations.js";
import { TodoAttachment, TodoItem, TodoItemPatch, User } from "./models/models.js";

export class TodoClient {
  #context: TodoClientContext;

  constructor(
    endpoint: string,
    credential: KeyCredential | KeyCredential,
    options?: TodoClientOptions,
  ) {
    this.#context = createTodoClientContext(endpoint, credential, options);
  }
}

export class TodoItemsClient {
  #context: TodoItemsClientContext;
  attachmentsClient: AttachmentsClient;
  constructor(endpoint: string, options?: TodoItemsClientOptions) {
    this.#context = createTodoItemsClientContext(endpoint, options);
    this.attachmentsClient = new AttachmentsClient(endpoint, options);
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
    return create_2(this.#context, item, contentType, options);
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

  constructor(endpoint: string, options?: AttachmentsClientOptions) {
    this.#context = createAttachmentsClientContext(endpoint, options);
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

  constructor(endpoint: string, options?: UsersClientOptions) {
    this.#context = createUsersClientContext(endpoint, options);
  }
  async create(user: User) {
    return create(this.#context, user);
  }
}
