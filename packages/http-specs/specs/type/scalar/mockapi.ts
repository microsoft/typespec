import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Scalar_String_get = passOnSuccess({
  uri: "/type/scalar/string",
  method: `get`,
  request: {},
  response: {
    status: 200,
    body: json("test"),
  },
  handler: (req: MockRequest) => {
    return { status: 200, body: json("test") };
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_String_put = passOnSuccess({
  uri: "/type/scalar/string",
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
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Boolean_get = passOnSuccess({
  uri: "/type/scalar/boolean",
  method: `get`,
  request: {},
  response: {
    status: 200,
    body: json(true),
  },
  handler: (req: MockRequest) => {
    return { status: 200, body: json(true) };
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Boolean_put = passOnSuccess({
  uri: "/type/scalar/boolean",
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
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_Unknown_get = passOnSuccess({
  uri: "/type/scalar/unknown",
  method: `get`,
  request: {},
  response: {
    status: 200,
    body: json("test"),
  },
  handler: (req: MockRequest) => {
    return { status: 200, body: json("test") };
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Unknown_put = passOnSuccess({
  uri: "/type/scalar/unknown",
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
  kind: "MockApiDefinition",
});

Scenarios.Type_Scalar_DecimalType_responseBody = passOnSuccess({
  uri: "/type/scalar/decimal/response_body",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_responseBody = passOnSuccess({
  uri: "/type/scalar/decimal128/response_body",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalType_requestBody = passOnSuccess({
  uri: "/type/scalar/decimal/resquest_body",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_requestBody = passOnSuccess({
  uri: "/type/scalar/decimal128/resquest_body",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalType_requestParameter = passOnSuccess({
  uri: "/type/scalar/decimal/request_parameter",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Type_requestParameter = passOnSuccess({
  uri: "/type/scalar/decimal128/request_parameter",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalVerify_prepareVerify = passOnSuccess({
  uri: "/type/scalar/decimal/prepare_verify",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Verify_prepareVerify = passOnSuccess({
  uri: "/type/scalar/decimal128/prepare_verify",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_DecimalVerify_verify = passOnSuccess({
  uri: "/type/scalar/decimal/verify",
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
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128Verify_verify = passOnSuccess({
  uri: "/type/scalar/decimal128/verify",
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
  kind: "MockApiDefinition",
});
