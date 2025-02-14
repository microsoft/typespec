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

const EmptyResponse = { status: 200 };

Scenarios.Payload_Pageable_ServerDrivenPagination_link = passOnSuccess([
  {
    uri: "/payload/pageable/server-driven-pagination/link",
    method: "get",
    request: {},
    response: EmptyResponse,
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
    response: {
      status: 200,
      body: json({
        pets: SecondPage,
      }),
    },
    kind: "MockApiDefinition",
  },
]);

function reqBodyResBodyHandler(req: MockRequest) {
  switch (req.body?.token) {
    case undefined:
      return {
        status: 200,
        body: json({
          pets: FirstPage,
          nextToken: "12345",
        }),
      } as const;
    case "12345":
      return {
        status: 200,
        body: json({
          pets: SecondPage,
        }),
      } as const;
    default:
      throw new ValidationError(
        "Unsupported continuation token",
        `"undefined" | "12345"`,
        req.body.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqBodyResBody = passOnSuccess([
  {
    uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-body-response-body",
    method: "get",
    request: {},
    response: EmptyResponse,
    handler: (req) => reqBodyResBodyHandler(req),
    kind: "MockApiDefinition",
  },
]);
