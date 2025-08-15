import {
  dyn,
  dynItem,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const FirstPage = [
  { id: "1", name: "dog" },
  { id: "2", name: "cat" },
];

const SecondPage = [
  { id: "3", name: "bird" },
  { id: "4", name: "fish" },
];

const FirstResponseTokenInBody = {
  status: 200,
  body: json({
    pets: FirstPage,
    nextToken: "page2",
  }),
};

const SecondResponse = {
  status: 200,
  body: json({
    pets: SecondPage,
  }),
};

const FirstResponseTokenInHeader = {
  status: 200,
  body: json({
    pets: FirstPage,
  }),
  headers: {
    "next-token": "page2",
    foo: "foo",
  },
};

const RequestTokenInQuery = {
  query: { token: "page2", bar: "bar" },
  headers: { foo: "foo" },
};

const RequestTokenInHeader = { headers: { token: "page2", foo: "foo" }, query: { bar: "bar" } };

function createTests(reqInfo: "query" | "header", resInfo: "body" | "header") {
  const uri = `/payload/pageable/server-driven-pagination/continuationtoken/request-${reqInfo}-response-${resInfo}`;
  function createHandler() {
    return (req: MockRequest) => {
      req.expect.containsHeader("foo", "foo");
      req.expect.containsQueryParam("bar", "bar");
      const token = reqInfo === "header" ? req.headers?.token : req.query?.token;
      switch (token) {
        case undefined:
          return resInfo === "header" ? FirstResponseTokenInHeader : FirstResponseTokenInBody;
        case "page2":
          return SecondResponse;
        default:
          throw new ValidationError(
            "Unsupported continuation token",
            `"undefined" | "page2"`,
            token,
          );
      }
    };
  }

  return passOnSuccess([
    {
      uri: uri,
      method: "get",
      request: { headers: { foo: "foo" }, query: { bar: "bar" } },
      response: resInfo === "header" ? FirstResponseTokenInHeader : FirstResponseTokenInBody,
      handler: createHandler(),
      kind: "MockApiDefinition",
    },
    {
      uri: uri,
      method: "get",
      request: reqInfo === "header" ? RequestTokenInHeader : RequestTokenInQuery,
      response: SecondResponse,
      handler: createHandler(),
      kind: "MockApiDefinition",
    },
  ]);
}

Scenarios.Payload_Pageable_ServerDrivenPagination_link = passOnSuccess([
  {
    uri: "/payload/pageable/server-driven-pagination/link",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: FirstPage,
        next: dyn`${dynItem("baseUrl")}/payload/pageable/server-driven-pagination/link/nextPage`,
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/payload/pageable/server-driven-pagination/link/nextPage",
    method: "get",
    request: {},
    response: SecondResponse,
    kind: "MockApiDefinition",
  },
]);

Scenarios.Payload_Pageable_ServerDrivenPagination_nestedLink = passOnSuccess([
  {
    uri: "/payload/pageable/server-driven-pagination/nested-link",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        nestedItems: {
          pets: FirstPage,
        },
        nestedNext: {
          next: dyn`${dynItem("baseUrl")}/payload/pageable/server-driven-pagination/nested-link/nextPage`,
        },
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/payload/pageable/server-driven-pagination/nested-link/nextPage",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        nestedItems: {
          pets: SecondPage,
        },
      }),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseBody =
  createTests("query", "body");

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseBody =
  createTests("header", "body");

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseHeader =
  createTests("query", "header");

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseHeader =
  createTests("header", "header");

Scenarios.Payload_Pageable_listWithoutContinuation = passOnSuccess([
  {
    uri: "/payload/pageable/simple",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        pets: [
          { id: "1", name: "dog" },
          { id: "2", name: "cat" },
          { id: "3", name: "bird" },
          { id: "4", name: "fish" },
        ],
      }),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryNestedResponseBody =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-query-nested-response-body",
      method: "get",
      request: { headers: { foo: "foo" }, query: { bar: "bar" } },
      response: {
        status: 200,
        body: json({
          nestedItems: {
            pets: FirstPage,
          },
          nestedNext: {
            nextToken: "page2",
          },
        }),
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("foo", "foo");
        req.expect.containsQueryParam("bar", "bar");
        const token = req.query?.token;

        switch (token) {
          case undefined:
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: FirstPage,
                },
                nestedNext: {
                  nextToken: "page2",
                },
              }),
            };
          case "page2":
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: SecondPage,
                },
              }),
            };
          default:
            throw new ValidationError(
              "Unsupported continuation token",
              `"undefined" | "page2"`,
              token,
            );
        }
      },
      kind: "MockApiDefinition",
    },
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-query-nested-response-body",
      method: "get",
      request: RequestTokenInQuery,
      response: {
        status: 200,
        body: json({
          nestedItems: {
            pets: SecondPage,
          },
        }),
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("foo", "foo");
        req.expect.containsQueryParam("bar", "bar");
        const token = req.query?.token;

        switch (token) {
          case undefined:
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: FirstPage,
                },
                nestedNext: {
                  nextToken: "page2",
                },
              }),
            };
          case "page2":
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: SecondPage,
                },
              }),
            };
          default:
            throw new ValidationError(
              "Unsupported continuation token",
              `"undefined" | "page2"`,
              token,
            );
        }
      },
      kind: "MockApiDefinition",
    },
  ]);

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderNestedResponseBody =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-header-nested-response-body",
      method: "get",
      request: { headers: { foo: "foo" }, query: { bar: "bar" } },
      response: {
        status: 200,
        body: json({
          nestedItems: {
            pets: FirstPage,
          },
          nestedNext: {
            nextToken: "page2",
          },
        }),
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("foo", "foo");
        req.expect.containsQueryParam("bar", "bar");
        const token = req.headers?.token;

        switch (token) {
          case undefined:
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: FirstPage,
                },
                nestedNext: {
                  nextToken: "page2",
                },
              }),
            };
          case "page2":
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: SecondPage,
                },
              }),
            };
          default:
            throw new ValidationError(
              "Unsupported continuation token",
              `"undefined" | "page2"`,
              token,
            );
        }
      },
      kind: "MockApiDefinition",
    },
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-header-nested-response-body",
      method: "get",
      request: RequestTokenInHeader,
      response: {
        status: 200,
        body: json({
          nestedItems: {
            pets: SecondPage,
          },
        }),
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("foo", "foo");
        req.expect.containsQueryParam("bar", "bar");
        const token = req.headers?.token;

        switch (token) {
          case undefined:
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: FirstPage,
                },
                nestedNext: {
                  nextToken: "page2",
                },
              }),
            };
          case "page2":
            return {
              status: 200,
              body: json({
                nestedItems: {
                  pets: SecondPage,
                },
              }),
            };
          default:
            throw new ValidationError(
              "Unsupported continuation token",
              `"undefined" | "page2"`,
              token,
            );
        }
      },
      kind: "MockApiDefinition",
    },
  ]);
