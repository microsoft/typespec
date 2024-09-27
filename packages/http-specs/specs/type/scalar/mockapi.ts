import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Scalar_String = passOnSuccess({
  uri: "/type/scalar/string",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: "test",
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json("test") };
      },
    },
    {
      method: `put`,
      request: {
        body: "test",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Boolean = passOnSuccess({
  uri: "/type/scalar/boolean",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: true,
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(true) };
      },
    },
    {
      method: `put`,
      request: {
        body: true,
        config: {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Unknown = passOnSuccess({
  uri: "/type/scalar/unknown",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: "test",
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json("test") };
      },
    },
    {
      method: `put`,
      request: {
        body: "test",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal_Response_Body = passOnSuccess({
  uri: "/type/scalar/decimal/response_body",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: 0.33333,
      },
      handler: (req: MockRequest) => {
        return {
          status: 200,
          body: json(0.33333),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128_Response_Body = passOnSuccess({
  uri: "/type/scalar/decimal128/response_body",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: 0.33333,
      },
      handler: (req: MockRequest) => {
        return {
          status: 200,
          body: json(0.33333),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal_Request_Body = passOnSuccess({
  uri: "/type/scalar/decimal/resquest_body",
  mockMethods: [
    {
      method: `put`,
      request: {
        body: 0.33333,
        config: {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128_Request_Body = passOnSuccess({
  uri: "/type/scalar/decimal128/resquest_body",
  mockMethods: [
    {
      method: `put`,
      request: {
        body: 0.33333,
        config: {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal_Request_Parameter = passOnSuccess({
  uri: "/type/scalar/decimal/request_parameter",
  mockMethods: [
    {
      method: `get`,
      request: {
        config: {
          params: { value: 0.33333 },
        },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128_Request_Parameter = passOnSuccess({
  uri: "/type/scalar/decimal128/request_parameter",
  mockMethods: [
    {
      method: `get`,
      request: {
        config: {
          params: { value: 0.33333 },
        },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal_Prepare_Verify = passOnSuccess({
  uri: "/type/scalar/decimal/prepare_verify",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: [0.1, 0.1, 0.1],
      },
      handler: (req: MockRequest) => {
        return {
          status: 200,
          body: json([0.1, 0.1, 0.1]),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128_Prepare_Verify = passOnSuccess({
  uri: "/type/scalar/decimal128/prepare_verify",
  mockMethods: [
    {
      method: `get`,
      request: {},
      response: {
        status: 200,
        data: [0.1, 0.1, 0.1],
      },
      handler: (req: MockRequest) => {
        return {
          status: 200,
          body: json([0.1, 0.1, 0.1]),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal_Verify = passOnSuccess({
  uri: "/type/scalar/decimal/verify",
  mockMethods: [
    {
      method: `post`,
      request: {
        body: 0.3,
        config: {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
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
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Scalar_Decimal128_Verify = passOnSuccess({
  uri: "/type/scalar/decimal128/verify",
  mockMethods: [
    {
      method: `post`,
      request: {
        body: 0.3,
        config: {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
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
  ],
  kind: "MockApiDefinition",
});
