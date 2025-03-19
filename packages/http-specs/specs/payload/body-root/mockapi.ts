import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

// Mock API scenarios
export const Scenarios: Record<string, ScenarioMockApi> = {};

// Input only scenario
Scenarios.Payload_BodyRoot_InputOnly = passOnSuccess({
  uri: "/input-only/alice",
  method: "post",
  request: {
    body: {
      age: 30,
      gender: "female",
    },
    headers: {
      "x-client-id": "123",
    },
  },
  response: { status: 204 },
  kind: "MockApiDefinition",
});

// Input and output scenario
Scenarios.Payload_BodyRoot_InputAndOutput = passOnSuccess({
  uri: "/input-and-output/alice",
  method: "post",
  request: {
    body: {
      age: 30,
      gender: "female",
    },
    headers: {
      "x-client-id": "123",
    },
  },
  response: {
    status: 200,
    body: json({
      name: "alice",
      age: 30,
      gender: "female",
    }),
    headers: {
      "x-client-id": "123",
    },
  },
  kind: "MockApiDefinition",
});

// Output only scenario
Scenarios.Payload_BodyRoot_OutputOnly = passOnSuccess({
  uri: "/output-only/alice",
  method: "get",
  response: {
    status: 200,
    body: json({
      name: "alice",
      age: 30,
      gender: "female",
    }),
    headers: {
      "x-client-id": "123",
    },
  },
  kind: "MockApiDefinition",
});

// Optional query scenario
Scenarios.Payload_BodyRoot_OptionalParam = passOnSuccess({
  uri: "/optional-param",
  method: "get",
  request: {
    query: json({
      orderby: "asc",
    }),
    headers: {
      "x-client-id": "123",
    },
  },
  response: {
    status: 200,
    body: json(["cat", "dog"]),
  },
  kind: "MockApiDefinition",
});
