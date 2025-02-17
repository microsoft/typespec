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
  CreateFileAttachmentOptions,
  CreateJsonAttachmentOptions,
  ListOptions as ListOptions_2,
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
  CreateFormOptions,
  CreateJsonOptions,
  DeleteOptions,
  GetOptions,
  ListOptions,
  UpdateOptions,
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
import { CreateOptions, create } from "./api/usersClient/usersClientOperations.js";
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
  async list(options?: ListOptions) {
    return list(this.#context, options);
  }
  async createJson(item: TodoItem, options?: CreateJsonOptions) {
    return createJson(this.#context, item, options);
  }
  async createForm(body: ToDoItemMultipartRequest, options?: CreateFormOptions) {
    return createForm(this.#context, body, options);
  }
  async get(id: number, options?: GetOptions) {
    return get(this.#context, id, options);
  }
  async update(id: number, patch: TodoItemPatch, options?: UpdateOptions) {
    return update(this.#context, id, patch, options);
  }
  async delete_(id: number, options?: DeleteOptions) {
    return delete_(this.#context, id, options);
  }
}

export class AttachmentsClient {
  #context: AttachmentsClientContext;

  constructor(endpoint: string, credential: KeyCredential, options?: AttachmentsClientOptions) {
    this.#context = createAttachmentsClientContext(endpoint, credential, options);
  }
  async list(itemId: number, options?: ListOptions_2) {
    return list_2(this.#context, itemId, options);
  }
  async createJsonAttachment(
    itemId: number,
    contents: TodoAttachment,
    options?: CreateJsonAttachmentOptions,
  ) {
    return createJsonAttachment(this.#context, itemId, contents, options);
  }
  async createFileAttachment(
    itemId: number,
    body: FileAttachmentMultipartRequest,
    options?: CreateFileAttachmentOptions,
  ) {
    return createFileAttachment(this.#context, itemId, body, options);
  }
}

export class UsersClient {
  #context: UsersClientContext;

  constructor(endpoint: string, options?: UsersClientOptions) {
    this.#context = createUsersClientContext(endpoint, options);
  }
  async create(user: User, options?: CreateOptions) {
    return create(this.#context, user, options);
  }
}
