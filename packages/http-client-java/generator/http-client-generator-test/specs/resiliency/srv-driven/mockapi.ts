import { MockRequest, ScenarioMockApi, ValidationError, passOnSuccess } from "@typespec/spec-api";

export const commonBase = "/resiliency/service-driven";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromNone = passOnSuccess([
  {
    uri: `${commonBase}/client\\:v1/service\\:v1/api-version\\:v1/add-optional-param/from-none`,
    method: "head",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v1/service\\:v2/api-version\\:v1/add-optional-param/from-none`,
    method: "head",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v1/add-optional-param/from-none`,
    method: "head",
    request: {},
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      if (req.params["new-parameter"] !== undefined) {
        throw new ValidationError(
          "Did not expect 'new-parameter'",
          undefined,
          req.params["new-parameter"],
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v2/add-optional-param/from-none`,
    method: "head",
    request: {
      query: {
        "new-parameter": "new",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromOneRequired = passOnSuccess([
  {
    uri: `${commonBase}/client\\:v1/service\\:v1/api-version\\:v1/add-optional-param/from-one-required`,
    method: "get",
    request: {
      query: {
        parameter: "required",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v1/service\\:v2/api-version\\:v1/add-optional-param/from-one-required`,
    method: "get",
    request: {
      query: {
        parameter: "required",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v1/add-optional-param/from-one-required`,
    method: "get",
    request: {
      query: {
        parameter: "required",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("parameter", "required");
      if (req.params["new-parameter"] !== undefined) {
        throw new ValidationError(
          "Did not expect 'new-parameter'",
          undefined,
          req.params["new-parameter"],
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v2/add-optional-param/from-one-required`,
    method: "get",
    request: {
      query: {
        parameter: "required",
        "new-parameter": "new",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Resiliency_ServiceDriven_AddOptionalParam_fromOneOptional = passOnSuccess([
  {
    uri: `${commonBase}/client\\:v1/service\\:v1/api-version\\:v1/add-optional-param/from-one-optional`,
    method: "get",
    request: {
      query: {
        parameter: "optional",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v1/service\\:v2/api-version\\:v1/add-optional-param/from-one-optional`,
    method: "get",
    request: {
      query: {
        parameter: "optional",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v1/add-optional-param/from-one-optional`,
    method: "get",
    request: {
      query: {
        parameter: "optional",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("parameter", "optional");
      if (req.params["new-parameter"] !== undefined) {
        throw new ValidationError(
          "Did not expect 'new-parameter'",
          undefined,
          req.params["new-parameter"],
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v2/add-optional-param/from-one-optional`,
    method: "get",
    request: {
      query: {
        parameter: "optional",
        "new-parameter": "new",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Resiliency_ServiceDriven_breakTheGlass = passOnSuccess({
  uri: `${commonBase}/client\\:v1/service\\:v2/api-version\\:v2/add-operation`,
  method: "delete",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Resiliency_ServiceDriven_addOperation = passOnSuccess({
  uri: `${commonBase}/client\\:v2/service\\:v2/api-version\\:v2/add-operation`,
  method: "delete",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
