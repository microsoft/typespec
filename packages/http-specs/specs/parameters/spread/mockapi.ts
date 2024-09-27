import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Spread_Model_Request_Body = passOnSuccess({
  uri: `/parameters/spread/model/request-body`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_Composite_Request_Only_With_Body = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-only-with-body`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_Composite_Request_Without_Body_Foo = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-without-body/foo`,
  mockMethods: [
    {
      method: "put",
      request: {
        headers: {
          "test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("test-header", "bar");
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_Composite_Request_Foo = passOnSuccess({
  uri: `/parameters/spread/model/composite-request/foo`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
        },
        headers: {
          "test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("test-header", "bar");
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_Composite_Request_Mix_Foo = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-mix/foo`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          prop: "foo",
        },
        headers: {
          "test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("test-header", "bar");
        req.expect.bodyEquals({ prop: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_Request_Body = passOnSuccess({
  uri: `/parameters/spread/alias/request-body`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_Request_Parameter_1 = passOnSuccess({
  uri: `/parameters/spread/alias/request-parameter/1`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
        },
        headers: {
          "x-ms-test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("x-ms-test-header", "bar");
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_Multiple_Parameters_1 = passOnSuccess({
  uri: `/parameters/spread/alias/multiple-parameters/1`,
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          requiredString: "foo",
          optionalInt: 1,
          requiredIntList: [1, 2],
          optionalStringList: ["foo", "bar"],
        },
        headers: {
          "x-ms-test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("x-ms-test-header", "bar");
        req.expect.bodyEquals({
          requiredString: "foo",
          optionalInt: 1,
          requiredIntList: [1, 2],
          optionalStringList: ["foo", "bar"],
        });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_Inner_Model_Parameter_1 = passOnSuccess({
  uri: `/parameters/spread/alias/inner-model-parameter/1`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          name: "foo",
        },
        headers: {
          "x-ms-test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("x-ms-test-header", "bar");
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_Inner_Alias_Parameter_1 = passOnSuccess({
  uri: `/parameters/spread/alias/inner-alias-parameter/1`,
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          name: "foo",
          age: 1,
        },
        headers: {
          "x-ms-test-header": "bar",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("x-ms-test-header", "bar");
        req.expect.bodyEquals({ name: "foo", age: 1 });
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
