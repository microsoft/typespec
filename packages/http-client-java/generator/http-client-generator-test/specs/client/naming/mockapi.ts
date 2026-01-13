import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Naming_Property_client = passOnSuccess({
  uri: "/client/naming/property/client",
  method: "post",
  request: {
    body: json({ defaultName: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Property_language = passOnSuccess({
  uri: "/client/naming/property/language",
  method: "post",
  request: {
    body: json({ defaultName: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Property_compatibleWithEncodedName = passOnSuccess({
  uri: `/client/naming/property/compatible-with-encoded-name`,
  method: "post",
  request: {
    body: json({ wireName: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_operation = passOnSuccess({
  uri: `/client/naming/operation`,
  method: "post",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_parameter = passOnSuccess({
  uri: `/client/naming/parameter`,
  method: "post",
  request: {
    query: { defaultName: "true" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Header_request = passOnSuccess({
  uri: `/client/naming/header`,
  method: "post",
  request: {
    headers: { "default-name": "true" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Header_response = passOnSuccess({
  uri: `/client/naming/header`,
  method: "get",
  request: {},
  response: {
    status: 204,
    headers: {
      "default-name": "true",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Model_client = passOnSuccess({
  uri: `/client/naming/model/client`,
  method: "post",
  request: {
    body: json({ defaultName: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_Model_language = passOnSuccess({
  uri: `/client/naming/model/language`,
  method: "post",
  request: {
    body: json({ defaultName: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_UnionEnum_unionEnumName = passOnSuccess({
  uri: `/client/naming/union-enum/union-enum-name`,
  method: "post",
  request: {
    body: json("value1"),
    headers: {
      "Content-Type": "text/plain",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_UnionEnum_unionEnumMemberName = passOnSuccess({
  uri: `/client/naming/union-enum/union-enum-member-name`,
  method: "post",
  request: {
    body: json("value1"),
    headers: {
      "Content-Type": "text/plain",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
