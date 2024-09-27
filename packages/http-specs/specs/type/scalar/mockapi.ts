import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Scalar_String_get = passOnSuccess({
  uri: "/type/scalar/string",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json("test"),
    },
    handler: (req: MockRequest) => {
      return { status: 200, body: json("test") };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_String_put = passOnSuccess({
  uri: "/type/scalar/string",
  mockMethod: {
    method: `put`,
    request: {
      body: "test",
      headers: {
        "Content-Type": "text/plain",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals("test");
      return { status: 204 };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Boolean_get = passOnSuccess({
  uri: "/type/scalar/boolean",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json(true),
    },
    handler: (req: MockRequest) => {
      return { status: 200, body: json(true) };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Boolean_put = passOnSuccess({
  uri: "/type/scalar/boolean",
  mockMethod: {
    method: `put`,
    request: {
      body: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals(true);
      return { status: 204 };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Unknown_get = passOnSuccess({
  uri: "/type/scalar/unknown",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json("test"),
    },
    handler: (req: MockRequest) => {
      return { status: 200, body: json("test") };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Unknown_put = passOnSuccess({
  uri: "/type/scalar/unknown",
  mockMethod: {
    method: `put`,
    request: {
      body: "test",
      headers: {
        "Content-Type": "text/plain",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals("test");
      return { status: 204 };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_DecimalType_responseBody = passOnSuccess({
  uri: "/type/scalar/decimal/response_body",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json(0.33333),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json(0.33333),
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_responseBody = passOnSuccess({
  uri: "/type/scalar/decimal128/response_body",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json(0.33333),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json(0.33333),
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalType_requestBody = passOnSuccess({
  uri: "/type/scalar/decimal/resquest_body",
  mockMethod: {
    method: `put`,
    request: {
      body: 0.33333,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals(0.33333);
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_requestBody = passOnSuccess({
  uri: "/type/scalar/decimal128/resquest_body",
  mockMethod: {
    method: `put`,
    request: {
      body: 0.33333,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals(0.33333);
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalType_requestParameter = passOnSuccess({
  uri: "/type/scalar/decimal/request_parameter",
  mockMethod: {
    method: `get`,
    request: {
      params: { value: 0.33333 },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("value", "0.33333");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_requestParameter = passOnSuccess({
  uri: "/type/scalar/decimal128/request_parameter",
  mockMethod: {
    method: `get`,
    request: {
      params: { value: 0.33333 },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("value", "0.33333");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalVerify_prepareVerify = passOnSuccess({
  uri: "/type/scalar/decimal/prepare_verify",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json([0.1, 0.1, 0.1]),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json([0.1, 0.1, 0.1]),
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Verify_prepareVerify = passOnSuccess({
  uri: "/type/scalar/decimal128/prepare_verify",
  mockMethod: {
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json([0.1, 0.1, 0.1]),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json([0.1, 0.1, 0.1]),
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalVerify_verify = passOnSuccess({
  uri: "/type/scalar/decimal/verify",
  mockMethod: {
    method: `post`,
    request: {
      body: 0.3,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals(0.3);
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Verify_verify = passOnSuccess({
  uri: "/type/scalar/decimal128/verify",
  mockMethod: {
    method: `post`,
    request: {
      body: 0.3,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.bodyEquals(0.3);
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
