import { z } from "zod";

export const user = z.object({
  id: z.any(),
  username: z.any(),
  email: z.any(),
  password: z.any(),
  validated: z.any(),
});

export const todoItem = z.object({
  id: z.any(),
  title: z.any(),
  createdBy: z.any(),
  assignedTo: z.any(),
  description: z.any(),
  status: z.any(),
  createdAt: z.any(),
  updatedAt: z.any(),
  completedAt: z.any(),
  labels: z.any(),
  _dummy: z.any(),
});

export const todoLabelRecord = z.object({
  name: z.any(),
  color: z.any(),
});

export const todoFileAttachment = z.object({
  filename: z.any(),
  mediaType: z.any(),
  contents: z.any(),
});

export const todoUrlAttachment = z.object({
  description: z.any(),
  url: z.any(),
});

export const apiError = z.object({
  code: z.any(),
  message: z.any(),
});

export const standard4XxResponse = z.object({
  statusCode: z.any(),
});

export const standard5XxResponse = z.object({
  statusCode: z.any(),
});

export const userCreatedResponse = z.object({
  id: z.any(),
  username: z.any(),
  email: z.any(),
  password: z.any(),
  validated: z.any(),
  statusCode: z.number(),
  token: z.any(),
});

export const userExistsResponse = z.object({
  statusCode: z.number(),
  code: z.string(),
});

export const invalidUserResponse = z.object({
  statusCode: z.number(),
  code: z.string(),
});

export const paginationControls = z.object({
  limit: z.any(),
  offset: z.any(),
});

export const todoPage = z.object({
  items: z.object(),
  pageSize: z.any(),
  totalSize: z.any(),
  limit: z.any(),
  offset: z.any(),
  prevLink: z.any(),
  nextLink: z.any(),
});

export const todoItemPatch = z.object({
  title: z.any(),
  assignedTo: z.any(),
  description: z.any(),
  status: z.any(),
});

export const invalidTodoItem = z.object({
  statusCode: z.number(),
});

export const notFoundResponse = z.object({
  statusCode: z.number(),
});

export const noContentResponse = z.object({
  statusCode: z.number(),
});

export const page = z.object({
  items: z.object(),
});
