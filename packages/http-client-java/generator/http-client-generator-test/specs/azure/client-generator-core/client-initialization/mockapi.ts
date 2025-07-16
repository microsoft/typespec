import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Mock responses for HeaderParam scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_HeaderParam = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/header-param/with-query",
    method: "get",
    request: {
      query: {
        id: "test-id",
      },
      headers: {
        name: "test-name-value",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/header-param/with-body",
    method: "post",
    request: {
      headers: {
        name: "test-name-value",
      },
      body: json({
        name: "test-name",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Mock responses for MultipleParams scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_MultipleParams = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/multiple-params/with-query",
    method: "get",
    request: {
      query: {
        id: "test-id",
        region: "us-west",
      },
      headers: {
        name: "test-name-value",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/multiple-params/with-body",
    method: "post",
    request: {
      query: {
        region: "us-west",
      },
      headers: {
        name: "test-name-value",
      },
      body: json({
        name: "test-name",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Mock responses for MixedParams scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_MixedParams = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/mixed-params/with-query",
    method: "get",
    request: {
      query: {
        id: "test-id",
        region: "us-west",
      },
      headers: {
        name: "test-name-value",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/mixed-params/with-body",
    method: "post",
    request: {
      query: {
        region: "us-west",
      },
      headers: {
        name: "test-name-value",
      },
      body: json({
        name: "test-name",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Mock responses for PathParam scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_PathParam = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/path/sample-blob/with-query",
    method: "get",
    request: {
      query: {
        format: "text",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/path/sample-blob/get-standalone",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        name: "sample-blob",
        size: 42,
        contentType: "text/plain",
        createdOn: "2025-04-01T12:00:00Z",
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/path/sample-blob",
    method: "delete",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Mock responses for ParamAlias scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_ParamAlias = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/param-alias/sample-blob/with-aliased-name",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/param-alias/sample-blob/with-original-name",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Mock responses for ParentClient/ChildClient scenario
Scenarios.Azure_ClientGeneratorCore_ClientInitialization_ParentClient_ChildClient = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-initialization/child-client/sample-blob/with-query",
    method: "get",
    request: {
      query: {
        format: "text",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/child-client/sample-blob/get-standalone",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({
        name: "sample-blob",
        size: 42,
        contentType: "text/plain",
        createdOn: "2025-04-01T12:00:00Z",
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-initialization/child-client/sample-blob",
    method: "delete",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);
