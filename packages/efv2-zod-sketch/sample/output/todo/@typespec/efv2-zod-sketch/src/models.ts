import { z } from "zod";

export const enum todoStatus
{
notStarted,
inProgress,
completed
};


export const enum todoOwners
{
alice = "Alice",
bob = "Bob",
charlie = "Charlie"
};


export const enum todoDogNames
{
fido,
rover,
spot
};


export const enum todoLabelColor
{
red = 16711680,
green = 65280,
blue = 255
};


export const enum score
{
a = 90,
b = 80,
c = 70,
d = 60,
f = 50
};


export const enum interestingNumbers
{
pi = 3.14159,
e = 2.71828,
avagadro = 6.022e+23
};


export const todoLabelRecord = z.object(
{
name: z.string(),
color: z.string().optional()
}
);

export const todoItem = z.object(
{
id: z.number().safe(),
title: z.string().max(255),
createdBy: z.number().safe(),
assignedTo: z.number().safe().optional(),
description: z.string().optional(),
status: z.union([ z.string(), z.string(), z.string() ]),
createdAt: z.string().datetime(),
updatedAt: z.string().datetime(),
completedAt: z.string().datetime().optional(),
labels: z.union([ z.string(), z.array(z.string()), todoLabelRecord, z.array(todoLabelRecord) ]).optional(),
_dummy: z.string().optional()
}
);

export const user = z.object(
{
items: z.array(todoItem).optional(),
xRef: z.string().max(255).optional(),
nullableOptionalValue: z.union([ z.string().min(1).max(50), z.string().url(), z.null() ]).optional(),
constrainedScalar: z.string().min(1).max(50),
anotherItem: todoItem.optional(),
myPetRecord: z.record(z.string(),z.number()),
constrainedArray: z.array(z.string().min(1).max(50)),
petRecord:  z.object(
{
  name: z.string(),
  age: z.number().min(-2147483648).max(2147483647)
}
),
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
offsetDateTime1: z.string().datetime({offset: true}),
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
stringArray1: z.array(z.string()),
stringArray2: z.array(z.string()),
intArray1: z.array(z.number()).min(1),
intArray2: z.array(z.number()).max(10),
validated: z.boolean()
}
);



export const todoFileAttachment = z.object(
{
filename: z.string().max(255),
mediaType: z.string(),
contents: z.string()
}
);

export const todoUrlAttachment = z.object(
{
description: z.string(),
url: z.string().url()
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
statusCode: z.number().min(400).max(499)
}
);

export const standard5XxResponse = z.object(
{
statusCode: z.number().min(500).max(599)
}
);

export const userCreatedResponse = z.object(
{
items: z.array(todoItem).optional(),
xRef: z.string().max(255).optional(),
nullableOptionalValue: z.union([ z.string().min(1).max(50), z.string().url(), z.null() ]).optional(),
constrainedScalar: z.string().min(1).max(50),
anotherItem: todoItem.optional(),
myPetRecord: z.record(z.string(),z.number()),
constrainedArray: z.array(z.string().min(1).max(50)),
petRecord:  z.object(
{
  name: z.string(),
  age: z.number().min(-2147483648).max(2147483647)
}
),
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
offsetDateTime1: z.string().datetime({offset: true}),
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
stringArray1: z.array(z.string()),
stringArray2: z.array(z.string()),
intArray1: z.array(z.number()).min(1),
intArray2: z.array(z.number()).max(10),
validated: z.boolean(),
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
limit: z.number().min(-2147483648).max(2147483647).optional(),
offset: z.number().min(-2147483648).max(2147483647).optional()
}
);

export const todoPage = z.object(
{
items: z.array(todoItem),
pageSize: z.number().min(-2147483648).max(2147483647),
totalSize: z.number().min(-2147483648).max(2147483647),
limit: z.number().min(-2147483648).max(2147483647).optional(),
offset: z.number().min(-2147483648).max(2147483647).optional(),
prevLink: z.string().url().optional(),
nextLink: z.string().url().optional()
}
);

export const todoItemPatch = z.object(
{
title: z.string().max(255).optional(),
assignedTo: z.union([ z.number().safe().optional().optional(), z.null() ]).optional(),
description: z.union([ z.string().optional().optional(), z.null() ]).optional(),
status: z.union([ z.string(), z.string(), z.string() ]).optional()
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
items: z.array(z.union([ todoFileAttachment, todoUrlAttachment ]))
}
);