import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Spread_Model_spreadAsRequestBody = passOnSuccess(
  mockapi.put("/parameters/spread/model/request-body", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Model_spreadCompositeRequestOnlyWithBody = passOnSuccess(
  mockapi.put("/parameters/spread/model/composite-request-only-with-body", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Model_spreadCompositeRequestWithoutBody = passOnSuccess(
  mockapi.put("/parameters/spread/model/composite-request-without-body/foo", (req) => {
    req.expect.containsHeader("test-header", "bar");
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Model_spreadCompositeRequest = passOnSuccess(
  mockapi.put("/parameters/spread/model/composite-request/foo", (req) => {
    req.expect.containsHeader("test-header", "bar");
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Model_spreadCompositeRequestMix = passOnSuccess(
  mockapi.put("/parameters/spread/model/composite-request-mix/foo", (req) => {
    req.expect.containsHeader("test-header", "bar");
    req.expect.bodyEquals({ prop: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Alias_spreadAsRequestBody = passOnSuccess(
  mockapi.put("/parameters/spread/alias/request-body", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Alias_spreadAsRequestParameter = passOnSuccess(
  mockapi.put("/parameters/spread/alias/request-parameter/1", (req) => {
    req.expect.containsHeader("x-ms-test-header", "bar");
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Alias_spreadWithMultipleParameters = passOnSuccess(
  mockapi.put("/parameters/spread/alias/multiple-parameters/1", (req) => {
    req.expect.containsHeader("x-ms-test-header", "bar");
    req.expect.bodyEquals({
      requiredString: "foo",
      optionalInt: 1,
      requiredIntList: [1, 2],
      optionalStringList: ["foo", "bar"],
    });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerModel = passOnSuccess(
  mockapi.post("/parameters/spread/alias/inner-model-parameter/1", (req) => {
    req.expect.containsHeader("x-ms-test-header", "bar");
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Spread_Alias_spreadParameterWithInnerAlias = passOnSuccess(
  mockapi.post("/parameters/spread/alias/inner-alias-parameter/1", (req) => {
    req.expect.containsHeader("x-ms-test-header", "bar");
    req.expect.bodyEquals({ name: "foo", age: 1 });
    return { status: 204 };
  }),
);

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
    },
  ],
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
    },
  ],
});

Scenarios.Parameters_Spread_Model_Composite_Request_Without_Body_Foo = passOnSuccess({
  uri: `/parameters/spread/model/composite-request-without-body/foo`,
  mockMethods: [
    {
      method: "put",
      request: {
        config: {
          headers: {
            "test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
        config: {
          headers: {
            "test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
        config: {
          headers: {
            "test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
    },
  ],
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
        config: {
          headers: {
            "x-ms-test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
        config: {
          headers: {
            "x-ms-test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
        config: {
          headers: {
            "x-ms-test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
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
        config: {
          headers: {
            "x-ms-test-header": "bar",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});
