import { json, mockapi, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
const validUser = { id: 1, name: "Madge", etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b59" };
const validUser2 = { id: 2, name: "John", etag: "22bdc430-65e8-45ad-81d9-8ffa60d55b59" };
Scenarios.Azure_Core_Basic_createOrUpdate = passOnSuccess(
  mockapi.patch("/azure/core/basic/users/:id", (req) => {
    if (req.params.id !== "1") {
      throw new ValidationError("Expected path param id=1", "1", req.params.id);
    }
    req.expect.containsHeader("content-type", "application/merge-patch+json");
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    const validBody = { name: "Madge" };
    req.expect.bodyEquals(validBody);
    return { status: 200, body: json(validUser) };
  }),
);

Scenarios.Azure_Core_Basic_createOrReplace = passOnSuccess(
  mockapi.put("/azure/core/basic/users/:id", (req) => {
    if (req.params.id !== "1") {
      throw new ValidationError("Expected path param id=1", "1", req.params.id);
    }
    req.expect.containsHeader("content-type", "application/json");
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    const validBody = { name: "Madge" };
    req.expect.bodyEquals(validBody);
    return { status: 200, body: json(validUser) };
  }),
);

Scenarios.Azure_Core_Basic_get = passOnSuccess(
  mockapi.get("/azure/core/basic/users/:id", (req) => {
    if (req.params.id !== "1") {
      throw new ValidationError("Expected path param id=1", "1", req.params.id);
    }
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    return { status: 200, body: json(validUser) };
  }),
);

Scenarios.Azure_Core_Basic_list = passOnSuccess(
  mockapi.get("/azure/core/basic/users", (req) => {
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    req.expect.containsQueryParam("top", "5");
    req.expect.containsQueryParam("skip", "10");
    req.expect.containsQueryParam("orderby", "id");
    req.expect.containsQueryParam("filter", "id lt 10");
    if (!req.originalRequest.originalUrl.includes("select=id&select=orders&select=etag")) {
      throw new ValidationError(
        "Expected query param select=id&select=orders&select=etag ",
        "select=id&select=orders&select=etag",
        req.originalRequest.originalUrl,
      );
    }
    req.expect.containsQueryParam("expand", "orders");
    const responseBody = {
      value: [
        {
          id: 1,
          name: "Madge",
          etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b59",
          orders: [{ id: 1, userId: 1, detail: "a recorder" }],
        },
        {
          id: 2,
          name: "John",
          etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b5a",
          orders: [{ id: 2, userId: 2, detail: "a TV" }],
        },
      ],
    };
    return { status: 200, body: json(responseBody) };
  }),
);

Scenarios.Azure_Core_Basic_delete = passOnSuccess(
  mockapi.delete("/azure/core/basic/users/:id", (req) => {
    if (req.params.id !== "1") {
      throw new ValidationError("Expected path param id=1", "1", req.params.id);
    }
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    return { status: 204 };
  }),
);

Scenarios.Azure_Core_Basic_export = passOnSuccess(
  mockapi.post("/azure/core/basic/users/:id[:]export", (req) => {
    if (req.params.id !== "1") {
      throw new ValidationError("Expected path param id=1", "1", req.params.id);
    }
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    req.expect.containsQueryParam("format", "json");
    return { status: 200, body: json(validUser) };
  }),
);

const expectBody = { users: [validUser, validUser2] };
Scenarios.Azure_Core_Basic_exportAllUsers = passOnSuccess(
  mockapi.post("/azure/core/basic/users:exportallusers", (req) => {
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    req.expect.containsQueryParam("format", "json");
    return { status: 200, body: json(expectBody) };
  }),
);

Scenarios.Azure_Core_Basic_List = passOnSuccess({
  uri: "/azure/core/basic/users?select=id&select=orders&select=etag",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: {
            top: 5,
            skip: 10,
            orderby: "id",
            filter: "id lt 10",
            expand: "orders",
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: {
          value: [
            {
              id: 1,
              name: "Madge",
              etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b59",
              orders: [{ id: 1, userId: 1, detail: "a recorder" }],
            },
            {
              id: 2,
              name: "John",
              etag: "11bdc430-65e8-45ad-81d9-8ffa60d55b5a",
              orders: [{ id: 2, userId: 2, detail: "a TV" }],
            },
          ],
        },
      },
    },
  ],
});

Scenarios.Azure_Core_Basic = passOnSuccess({
  uri: "/azure/core/basic/users/1",
  mockMethods: [
    {
      method: "patch",
      request: {
        body: {
          name: "Madge",
        },
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
          headers: {
            "Content-Type": "application/merge-patch+json",
          },
        },
      },
      response: {
        status: 200,
        data: validUser,
      },
    },
    {
      method: "put",
      request: {
        body: {
          name: "Madge",
        },
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
      },
      response: {
        status: 200,
        data: validUser,
      },
    },
    {
      method: "get",
      request: {
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validUser,
      },
    },
    {
      method: "delete",
      request: {
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_Core_Basic_Export = passOnSuccess({
  uri: "/azure/core/basic/users/1:export",
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          params: {
            format: "json",
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validUser,
      },
    },
  ],
});

Scenarios.Azure_Core_Basic_Export_All_Users = passOnSuccess({
  uri: "/azure/core/basic/users:exportallusers",
  mockMethods: [
    {
      method: "post",
      request: {
        config: {
          params: {
            "api-version": "2022-12-01-preview",
            format: "json",
          },
        },
      },
      response: {
        status: 200,
        data: expectBody,
      },
    },
  ],
});
