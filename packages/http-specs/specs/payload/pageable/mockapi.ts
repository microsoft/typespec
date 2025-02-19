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
    nextToken: "12345",
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
    "next-token": "12345",
  },
};

const RequestTokenInQuery = {
  params: { token: "12345" },
};

const RequestTokenInHeader = { headers: { token: "12345" } };

function createTests(reqInfo: "query" | "header", resInfo: "body" | "header") {
  const uri = `/payload/pageable/server-driven-pagination/continuationtoken/request-${reqInfo}-response-${resInfo}`;
  function createHandler() {
    return (req: MockRequest) => {
      const token = reqInfo === "header" ? req.headers?.token : req.query?.token;
      switch (token) {
        case undefined:
          return resInfo === "header" ? FirstResponseTokenInHeader : FirstResponseTokenInBody;
        case "12345":
          return SecondResponse;
        default:
          throw new ValidationError(
            "Unsupported continuation token",
            `"undefined" | "12345"`,
            token,
          );
      }
    };
  }

  return passOnSuccess([
    {
      uri: uri,
      method: "get",
      request: {},
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
        next: "/payload/pageable/server-driven-pagination/link/nextPage",
      }),
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

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqQueryResBody = createTests(
  "query",
  "body",
);

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqHeaderResBody = createTests(
  "header",
  "body",
);

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqQueryResHeader = createTests(
  "query",
  "header",
);
Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqHeaderResHeader =
  createTests("header", "header");
