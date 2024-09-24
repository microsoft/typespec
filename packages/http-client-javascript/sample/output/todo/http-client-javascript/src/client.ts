import { TodoContext, TodoOptions, createTodoContext } from "./api/clientContext.js";
import { createAttachment, list as list_2 } from "./api/todoItems/attachments/operations.js";
import { create as create_2, delete_, get, list, update } from "./api/todoItems/operations.js";
import { create } from "./api/users/operations.js";
import { TodoAttachment, TodoItem, TodoItemPatch, User } from "./models/models.js";

export class TodoClient {
  todoItems: TodoItemsClient;
  attachments: AttachmentsClient;
  users: UsersClient;
  #context: TodoContext;
  constructor(endpoint: string, options?: TodoOptions) {
    this.#context = createTodoContext(endpoint, options);
    this.todoItems = new TodoItemsClient(this.#context);
    this.attachments = new AttachmentsClient(this.#context);
    this.users = new UsersClient(this.#context);
  }
}
export class TodoItemsClient {
  attachments: AttachmentsClient;
  #context: TodoContext;
  constructor(context: TodoContext) {
    this.#context = context;
    this.attachments = new AttachmentsClient(this.#context);
  }
  list(options?: { limit?: number; offset?: number }) {
    return list(this.#context, options);
  }

  create(
    item: TodoItem,
    contentType: "application/json",
    options?: {
      attachments?: TodoAttachment[];
    },
  ) {
    return create_2(this.#context, item, contentType, options);
  }

  get(id: number) {
    return get(this.#context, id);
  }

  update(id: number, patch: TodoItemPatch, contentType: "application/merge-patch+json") {
    return update(this.#context, id, patch, contentType);
  }

  delete(id: number) {
    return delete_(this.#context, id);
  }
}

export class AttachmentsClient {
  #context: TodoContext;
  constructor(context: TodoContext) {
    this.#context = context;
  }
  list(itemId: number) {
    return list_2(this.#context, itemId);
  }

  createAttachment(itemId: number, contents: TodoAttachment) {
    return createAttachment(this.#context, itemId, contents);
  }
}

export class UsersClient {
  #context: TodoContext;
  constructor(context: TodoContext) {
    this.#context = context;
  }
  create(user: User) {
    return create(this.#context, user);
  }
}
