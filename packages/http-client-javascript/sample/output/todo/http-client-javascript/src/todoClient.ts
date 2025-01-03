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
  createFileAttachment,
  createJsonAttachment,
  list as list_2,
} from "./api/todoItemsClient/attachmentsClient/operations.js";
import {
  TodoItemsClientContext,
  TodoItemsClientOptions,
  createTodoItemsClientContext,
} from "./api/todoItemsClient/clientContext.js";
import {
  createForm,
  createJson,
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
import {
  FileAttachmentMultipartRequest,
  ToDoItemMultipartRequest,
  TodoAttachment,
  TodoItem,
  TodoItemPatch,
  User,
} from "./models/models.js";

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
  async createJson(
    item: TodoItem,
    contentType: "application/json",
    options?: {
      attachments?: Array<TodoAttachment>;
    },
  ) {
    return createJson(this.#context, item, contentType, options);
  }
  async createForm(body: ToDoItemMultipartRequest, contentType: "multipart/form-data") {
    return createForm(this.#context, body, contentType);
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
  async createJsonAttachment(
    itemId: number,
    contents: TodoAttachment,
    contentType: "application/json",
  ) {
    return createJsonAttachment(this.#context, itemId, contents, contentType);
  }
  async createFileAttachment(
    itemId: number,
    body: FileAttachmentMultipartRequest,
    contentType: "multipart/form-data",
  ) {
    return createFileAttachment(this.#context, itemId, body, contentType);
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
