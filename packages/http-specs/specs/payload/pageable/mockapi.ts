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

function reqQueryResBodyHandler(req: MockRequest) {
  switch (req.params?.token) {
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
        req.params.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqQueryResBody = passOnSuccess(
  [
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body",
      method: "get",
      request: {},
      response: EmptyResponse,
      handler: (req) => reqQueryResBodyHandler(req),
      kind: "MockApiDefinition",
    },
  ],
);

function reqHeaderResBodyHandler(req: MockRequest) {
  switch (req.headers?.token) {
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
        req.headers.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqHeaderResBody =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body",
      method: "get",
      request: {},
      response: EmptyResponse,
      handler: (req) => reqHeaderResBodyHandler(req),
      kind: "MockApiDefinition",
    },
  ]);

function reqBodyResHeaderHandler(req: MockRequest) {
  switch (req.body?.token) {
    case undefined:
      return {
        status: 200,
        body: json({
          pets: FirstPage,
        }),
        headers: {
          "next-token": "12345",
        },
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
        req.headers.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqBodyResHeader =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-body-response-header",
      method: "get",
      request: {},
      response: EmptyResponse,
      handler: (req) => reqBodyResHeaderHandler(req),
      kind: "MockApiDefinition",
    },
  ]);

function reqQueryResHeaderHandler(req: MockRequest) {
  switch (req.params?.token) {
    case undefined:
      return {
        status: 200,
        body: json({
          pets: FirstPage,
        }),
        headers: {
          "next-token": "12345",
        },
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
        req.headers.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqQueryResHeader =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header",
      method: "get",
      request: {},
      response: EmptyResponse,
      handler: (req) => reqQueryResHeaderHandler(req),
      kind: "MockApiDefinition",
    },
  ]);

function reqHeaderResHeaderHandler(req: MockRequest) {
  switch (req.headers?.token) {
    case undefined:
      return {
        status: 200,
        body: json({
          pets: FirstPage,
        }),
        headers: {
          "next-token": "12345",
        },
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
        req.headers.token,
      );
  }
}

Scenarios.Payload_Pageable_ServerDrivenPagination_ContinuationToken_reqHeaderResHeader =
  passOnSuccess([
    {
      uri: "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header",
      method: "get",
      request: {},
      response: EmptyResponse,
      handler: (req) => reqHeaderResHeaderHandler(req),
      kind: "MockApiDefinition",
    },
  ]);
