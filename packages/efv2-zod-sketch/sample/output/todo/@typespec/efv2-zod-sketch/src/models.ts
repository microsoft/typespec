import { z } from "zod";

export const user = z.object(
{
id: z.string(),
username: z.string(),
email: z.string(),
password: z.string(),
accountCreated: z.string().datetime(),
floaty: z.string(),
validated: z.string()
}
);

export const todoItem = z.object(
{
id: z.string(),
title: z.string(),
createdBy: z.any(),
assignedTo: z.any(),
description: z.string(),
status: z.any(),
createdAt: z.string().datetime(),
updatedAt: z.string().datetime(),
completedAt: z.string().datetime(),
labels: z.any(),
_dummy: z.string()
}
);

export const todoLabelRecord = z.object(
{
name: z.string(),
color: z.string()
}
);

export const todoFileAttachment = z.object(
{
filename: z.string(),
mediaType: z.string(),
contents: z.string()
}
);

export const todoUrlAttachment = z.object(
{
description: z.string(),
url: z.string()
}
);

export const apiError = z.object(
{
code: z.string(),
message: z.string()
}
);

export const standard4XxResponse = z.object(
{
statusCode: z.string()
}
);

export const standard5XxResponse = z.object(
{
statusCode: z.string()
}
);

export const userCreatedResponse = z.object(
{
id: z.string(),
username: z.string(),
email: z.string(),
password: z.string(),
accountCreated: z.string().datetime(),
floaty: z.string(),
validated: z.string(),
statusCode: z.number(),
token: z.string()
}
);

export const userExistsResponse = z.object(
{
statusCode: z.number(),
code: z.string()
}
);

export const invalidUserResponse = z.object(
{
statusCode: z.number(),
code: z.string()
}
);

export const paginationControls = z.object(
{
limit: z.string(),
offset: z.string()
}
);

export const todoPage = z.object(
{
items: z.any(),
pageSize: z.string(),
totalSize: z.string(),
limit: z.string(),
offset: z.string(),
prevLink: z.string(),
nextLink: z.string()
}
);

export const todoItemPatch = z.object(
{
title: z.any(),
assignedTo: z.any(),
description: z.any(),
status: z.any()
}
);

export const invalidTodoItem = z.object(
{
statusCode: z.number()
}
);

export const notFoundResponse = z.object(
{
statusCode: z.number()
}
);

export const noContentResponse = z.object(
{
statusCode: z.number()
}
);

export const page = z.object(
{
items: z.any()
}
);