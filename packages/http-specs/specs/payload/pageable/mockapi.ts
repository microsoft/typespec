import {
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
      // TODO: need better way to handle baseUrl
      // body: json({
      //   pets: FirstPage,
      //   next: "/payload/pageable/server-driven-pagination/link/nextPage",
      // }),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json({
          pets: FirstPage,
          next: `${req.baseUrl}/payload/pageable/server-driven-pagination/link/nextPage`,
        }),
      };
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

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseBody =
  createTests("query", "body");

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseBody =
  createTests("header", "body");

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestQueryResponseHeader =
  createTests("query", "header");
Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_requestHeaderResponseHeader =
  createTests("header", "header");
