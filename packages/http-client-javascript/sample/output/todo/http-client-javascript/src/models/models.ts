export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  validated: boolean;
}

export interface UserCreatedResponse {
  id: number;
  username: string;
  email: string;
  password: string;
  validated: boolean;
  statusCode: 200;
  token: string;
}

export interface UserExistsResponse extends ApiError {
  statusCode: 409;
  code: "user-exists";
}

export interface ApiError {
  code: string;
  message: string;
}

export interface InvalidUserResponse extends ApiError {
  statusCode: 422;
  code: "invalid-user";
}

export interface Standard4XxResponse extends ApiError {
  statusCode: number;
}

export interface Standard5XxResponse extends ApiError {
  statusCode: number;
}

export interface TodoPage {
  items: TodoItem[];
  pagination: {
    pageSize: number;
    totalSize: number;
    limit?: number;
    offset?: number;
    prevLink?: string;
    nextLink?: string;
  };
}

export interface TodoItem {
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
  _dummy?: string;
}

export type TodoLabels = string | string[] | TodoLabelRecord | TodoLabelRecord[];

export interface TodoLabelRecord {
  name: string;
  color?: string;
}

export type TodoAttachment = TodoFileAttachment | TodoUrlAttachment;

export interface TodoFileAttachment {
  filename: string;
  mediaType: string;
  contents: Uint8Array;
}

export interface TodoUrlAttachment {
  description: string;
  url: string;
}

export interface InvalidTodoItem extends ApiError {
  statusCode: 422;
}

export interface NotFoundResponse {
  statusCode: 404;
}

export interface TodoItemPatch {
  title?: string;
  assignedTo?: number | null;
  description?: string | null;
  status?: "NotStarted" | "InProgress" | "Completed";
}

export interface NoContentResponse {
  statusCode: 204;
}
