import { KeyCredential } from "@typespec/ts-http-runtime";
import {
  TodoClientContext,
  TodoClientOptions,
  createTodoClientContext,
} from "./api/todoClientContext.js";
import {
  AttachmentsClientContext,
  AttachmentsClientOptions,
  createAttachmentsClientContext,
} from "./api/todoItemsClient/attachmentsClient/attachmentsClientContext.js";
import {
  createFileAttachment,
  createJsonAttachment,
  list as list_2,
} from "./api/todoItemsClient/attachmentsClient/attachmentsClientOperations.js";
import {
  TodoItemsClientContext,
  TodoItemsClientOptions,
  createTodoItemsClientContext,
} from "./api/todoItemsClient/todoItemsClientContext.js";
import {
  createForm,
  createJson,
  delete_,
  get,
  list,
  update,
} from "./api/todoItemsClient/todoItemsClientOperations.js";
import {
  UsersClientContext,
  UsersClientOptions,
  createUsersClientContext,
} from "./api/usersClient/usersClientContext.js";
import { create } from "./api/usersClient/usersClientOperations.js";
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

  constructor(endpoint: string, credential: KeyCredential, options?: TodoClientOptions) {
    this.#context = createTodoClientContext(endpoint, credential, options);
  }
}

export class TodoItemsClient {
  #context: TodoItemsClientContext;
  attachmentsClient: AttachmentsClient;
  constructor(endpoint: string, credential: KeyCredential, options?: TodoItemsClientOptions) {
    this.#context = createTodoItemsClientContext(endpoint, credential, options);
    this.attachmentsClient = new AttachmentsClient(endpoint, credential, options);
  }
  async list(options?: { limit?: number; offset?: number }) {
    return list(this.#context, options);
  }
  async createJson(
    item: TodoItem,
    options?: {
      attachments?: Array<TodoAttachment>;
    },
  ) {
    return createJson(this.#context, item, options);
  }
  async createForm(body: ToDoItemMultipartRequest) {
    return createForm(this.#context, body);
  }
  async get(id: number) {
    return get(this.#context, id);
  }
  async update(id: number, patch: TodoItemPatch) {
    return update(this.#context, id, patch);
  }
  async delete_(id: number) {
    return delete_(this.#context, id);
  }
}

export class AttachmentsClient {
  #context: AttachmentsClientContext;

  constructor(endpoint: string, credential: KeyCredential, options?: AttachmentsClientOptions) {
    this.#context = createAttachmentsClientContext(endpoint, credential, options);
  }
  async list(itemId: number) {
    return list_2(this.#context, itemId);
  }
  async createJsonAttachment(itemId: number, contents: TodoAttachment) {
    return createJsonAttachment(this.#context, itemId, contents);
  }
  async createFileAttachment(itemId: number, body: FileAttachmentMultipartRequest) {
    return createFileAttachment(this.#context, itemId, body);
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
