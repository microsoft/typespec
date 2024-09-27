import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Spread_Model_spreadAsRequestBody = passOnSuccess({
  uri: `/parameters/spread/model/request-body`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestOnlyWithBody = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-only-with-body`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestWithoutBody = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-without-body/foo`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequest = passOnSuccess({
  uri: `/parameters/spread/model/composite-request/foo`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestMix = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-mix/foo`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadAsRequestBody = passOnSuccess({
  uri: `/parameters/spread/alias/request-body`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadAsRequestParameter = passOnSuccess({
  uri: `/parameters/spread/alias/request-parameter/1`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadWithMultipleParameters = passOnSuccess({
  uri: `/parameters/spread/alias/multiple-parameters/1`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerModel = passOnSuccess({
  uri: `/parameters/spread/alias/inner-model-parameter/1`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerAlias = passOnSuccess({
  uri: `/parameters/spread/alias/inner-alias-parameter/1`,
  mockMethod: {
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
  kind: "MockApiDefinition",
});
