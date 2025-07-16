import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Spread_Model_spreadAsRequestBody = passOnSuccess({
  uri: `/parameters/spread/model/request-body`,
  method: "put",
  request: {
    body: json({
      name: "foo",
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestOnlyWithBody = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-only-with-body`,
  method: "put",
  request: {
    body: json({
      name: "foo",
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestWithoutBody = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-without-body/foo`,
  method: "put",
  request: {
    headers: {
      "test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequest = passOnSuccess({
  uri: `/parameters/spread/model/composite-request/foo`,
  method: "put",
  request: {
    body: json({
      name: "foo",
    }),
    headers: {
      "test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Model_spreadCompositeRequestMix = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-mix/foo`,
  method: "put",
  request: {
    body: json({
      prop: "foo",
    }),
    headers: {
      "test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadAsRequestBody = passOnSuccess({
  uri: `/parameters/spread/alias/request-body`,
  method: "put",
  request: {
    body: json({
      name: "foo",
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadAsRequestParameter = passOnSuccess({
  uri: `/parameters/spread/alias/request-parameter/1`,
  method: "put",
  request: {
    body: json({
      name: "foo",
    }),
    headers: {
      "x-ms-test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadWithMultipleParameters = passOnSuccess({
  uri: `/parameters/spread/alias/multiple-parameters/1`,
  method: "put",
  request: {
    body: json({
      requiredString: "foo",
      optionalInt: 1,
      requiredIntList: [1, 2],
      optionalStringList: ["foo", "bar"],
    }),
    headers: {
      "x-ms-test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerModel = passOnSuccess({
  uri: `/parameters/spread/alias/inner-model-parameter/1`,
  method: "post",
  request: {
    body: json({
      name: "foo",
    }),
    headers: {
      "x-ms-test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerAlias = passOnSuccess({
  uri: `/parameters/spread/alias/inner-alias-parameter/1`,
  method: "post",
  request: {
    body: json({
      name: "foo",
      age: 1,
    }),
    headers: {
      "x-ms-test-header": "bar",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
