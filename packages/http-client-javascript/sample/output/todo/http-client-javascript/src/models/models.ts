export interface ConstructorParameters {
  endpoint: string;
  credential: "http" | "apiKey";
}

export interface ConstructorParameters_2 {
  endpoint: string;
}

export interface ConstructorParameters_3 {
  endpoint: string;
}

export interface ConstructorParameters_4 {
  endpoint: string;
  credential: "noAuth";
}

export interface TodoPage {
  items: Array<TodoItem>;
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

export type TodoLabels = string | Array<string> | TodoLabelRecord | Array<TodoLabelRecord>;

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

export interface TodoItemPatch {
  title?: string;
  assignedTo?: number | null;
  description?: string | null;
  status?: "NotStarted" | "InProgress" | "Completed";
}

export interface AttachmentPage {
  items: Array<TodoAttachment>;
  pagination: {
    pageSize: number;
    totalSize: number;
    limit?: number;
    offset?: number;
    prevLink?: string;
    nextLink?: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  validated: boolean;
}
