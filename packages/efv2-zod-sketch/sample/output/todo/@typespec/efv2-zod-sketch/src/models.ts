import { z } from "zod";

export const enum todoStatus {
  notStarted,
  inProgress,
  completed,
}

export const enum todoOwners {
  alice = "Alice",
  bob = "Bob",
  charlie = "Charlie",
}

export const enum todoDogNames {
  fido,
  rover,
  spot,
}

export const enum todoLabelColor {
  red = 16711680,
  green = 65280,
  blue = 255,
}

export const enum score {
  a = 90,
  b = 80,
  c = 70,
  d = 60,
  f = 50,
}

export const enum interestingNumbers {
  pi = 3.14159,
  e = 2.71828,
  avagadro = 6.022e23,
}

export const user = z.object({
  id: z.number().safe(),
  username: z.string().min(2).max(50),
  email: z.string(),
  password: z.string(),
  boolean1: z.boolean(),
  byte1: z.string(),
  decimal1: z.number(),
  decimal2: z.number(),
  duration1: z.string().duration(),
  float1: z.number(),
  float2: z.number(),
  float3: z.number(),
  int1: z.number().min(-128).max(127),
  int2: z.number().min(-32768).max(32767),
  int3: z.number().min(-2147483648).max(2147483647),
  int4: z.bigint().gte(-9223372036854775808n).lte(9223372036854775807n),
  offsetDateTime1: z.string().datetime({ offset: true }),
  plainDate1: z.string().date(),
  plainTime1: z.string().time(),
  safeint1: z.number().safe(),
  uint1: z.number().nonnegative().max(255),
  uint2: z.number().nonnegative().max(65535),
  uint3: z.number().nonnegative().max(4294967295),
  uint4: z.bigint().nonnegative().lte(18446744073709551615n),
  url1: z.string().url(),
  utcDateTime1: z.string().datetime(),
  numeric1: z.number(),
  string1: z.string(),
  int16_1: z.number().min(5).max(10),
  uint_1: z.number().nonnegative().min(42).max(255),
  float_1: z.number().max(10),
  boundNumeric: z.number().min(5).max(10),
  validated: z.boolean(),
});

export const todoItem = z.object({
  id: z.number().safe(),
  title: z.string().max(255),
  createdBy: z.any(),
  assignedTo: z.any(),
  description: z.string(),
  status: z.any(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  labels: z.any(),
  _dummy: z.string(),
});

export const todoLabelRecord = z.object({
  name: z.string(),
  color: z.string(),
});

export const todoFileAttachment = z.object({
  filename: z.string().max(255),
  mediaType: z.string(),
  contents: z.string(),
});

export const todoUrlAttachment = z.object({
  description: z.string(),
  url: z.string().url(),
});

export const apiError = z.object({
  code: z.string(),
  message: z.string(),
});

export const standard4XxResponse = z.object({
  statusCode: z.number().min(400).max(499),
});

export const standard5XxResponse = z.object({
  statusCode: z.number().min(500).max(599),
});

export const userCreatedResponse = z.object({
  id: z.number().safe(),
  username: z.string().min(2).max(50),
  email: z.string(),
  password: z.string(),
  boolean1: z.boolean(),
  byte1: z.string(),
  decimal1: z.number(),
  decimal2: z.number(),
  duration1: z.string().duration(),
  float1: z.number(),
  float2: z.number(),
  float3: z.number(),
  int1: z.number().min(-128).max(127),
  int2: z.number().min(-32768).max(32767),
  int3: z.number().min(-2147483648).max(2147483647),
  int4: z.bigint().gte(-9223372036854775808n).lte(9223372036854775807n),
  offsetDateTime1: z.string().datetime({ offset: true }),
  plainDate1: z.string().date(),
  plainTime1: z.string().time(),
  safeint1: z.number().safe(),
  uint1: z.number().nonnegative().max(255),
  uint2: z.number().nonnegative().max(65535),
  uint3: z.number().nonnegative().max(4294967295),
  uint4: z.bigint().nonnegative().lte(18446744073709551615n),
  url1: z.string().url(),
  utcDateTime1: z.string().datetime(),
  numeric1: z.number(),
  string1: z.string(),
  int16_1: z.number().min(5).max(10),
  uint_1: z.number().nonnegative().min(42).max(255),
  float_1: z.number().max(10),
  boundNumeric: z.number().min(5).max(10),
  validated: z.boolean(),
  statusCode: z.number(),
  token: z.string(),
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
  limit: z.number().min(-2147483648).max(2147483647),
  offset: z.number().min(-2147483648).max(2147483647),
});

export const todoPage = z.object({
  items: z.any(),
  pageSize: z.number().min(-2147483648).max(2147483647),
  totalSize: z.number().min(-2147483648).max(2147483647),
  limit: z.number().min(-2147483648).max(2147483647),
  offset: z.number().min(-2147483648).max(2147483647),
  prevLink: z.string().url(),
  nextLink: z.string().url(),
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
  items: z.any(),
});
