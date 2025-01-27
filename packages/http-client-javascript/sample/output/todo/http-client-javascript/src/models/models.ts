import { File as File_2 } from "../helpers/multipart-helpers.js";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  validated: boolean;
}

export type Safeint = number;

export type Int64 = bigint;

export type Integer = number;

export type Numeric = number;

export type String = string;

export type Boolean = boolean;

export interface Page {
  items: Array<TodoAttachment>;
}

export interface TodoAttachment {
  filename: string;
  mediaType: string;
  contents: Uint8Array;
}

export type Bytes = Uint8Array;

export interface FileAttachmentMultipartRequest {
  contents: File;
}

export type File = File_2;

export type Int32 = number;

export interface TodoPage {
  items: Array<TodoItem>;
  pageSize: number;
  totalSize: number;
  limit?: number;
  offset?: number;
  prevLink?: string;
  nextLink?: string;
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

export type UtcDateTime = Date;

export type TodoLabels = string | Array<string> | TodoLabelRecord | Array<TodoLabelRecord>;

export interface TodoLabelRecord {
  name: string;
  color?: string;
}

export type Url = string;

export interface ToDoItemMultipartRequest {
  item: TodoItem;
  attachments?: Array<File>;
}

export interface TodoItemPatch {
  title?: string;
  assignedTo?: number | null;
  description?: string | null;
  status?: "NotStarted" | "InProgress" | "Completed";
}
