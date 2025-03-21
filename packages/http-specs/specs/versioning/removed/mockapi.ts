import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_Removed_v2 = passOnSuccess({
  uri: `/versioning/removed/api-version:v2/v2`,
  method: `post`,
  request: {
    body: json({
      prop: "foo",
      enumProp: "enumMemberV2",
      unionProp: "bar",
    }),
  },
  response: {
    status: 200,
    body: json({ prop: "foo", enumProp: "enumMemberV2", unionProp: "bar" }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Versioning_Removed_modelV3 = passOnSuccess({
  uri: `/versioning/removed/api-version[:]v1/v3`,
  method: "post",
  request: {
    body: json({
      id: "123",
      enumProp: "enumMemberV1",
    }),
  },
  response: {
    status: 200,
    body: json({ id: "123", enumProp: "enumMemberV1" }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Versioning_Removed_modelV3_V2 = passOnSuccess({
  uri: `/versioning/removed/api-version[:]v2/v3`,
  method: "post",
  request: {
    body: json({
      id: "123",
      enumProp: "enumMemberV1",
    }),
  },
  response: {
    status: 200,
    body: json({ id: "123", enumProp: "enumMemberV1" }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Versioning_Removed_modelV3_V2preview = passOnSuccess({
  uri: `/versioning/removed/api-version[:]v2preview/v3`,
  method: "post",
  request: {
    body: json({
      id: "123",
    }),
  },
  response: {
    status: 200,
    body: json({ id: "123" }),
  },
  kind: "MockApiDefinition",
});
