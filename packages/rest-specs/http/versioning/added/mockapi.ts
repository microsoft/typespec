import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_Added_v1 = passOnSuccess(
  mockapi.post("/versioning/added/api-version:v2/v1", (req) => {
    req.expect.bodyEquals({ prop: "foo", enumProp: "enumMemberV2", unionProp: 10 });
    req.expect.containsHeader("header-v2", "bar");
    return {
      status: 200,
      body: json({ prop: "foo", enumProp: "enumMemberV2", unionProp: 10 }),
    };
  }),
);

Scenarios.Versioning_Added_v2 = passOnSuccess(
  mockapi.post("/versioning/added/api-version:v2/v2", (req) => {
    req.expect.bodyEquals({ prop: "foo", enumProp: "enumMember", unionProp: "bar" });
    return {
      status: 200,
      body: json({ prop: "foo", enumProp: "enumMember", unionProp: "bar" }),
    };
  }),
);

Scenarios.Versioning_Added_InterfaceV2 = passOnSuccess(
  mockapi.post("/versioning/added/api-version:v2/interface-v2/v2", (req) => {
    req.expect.bodyEquals({ prop: "foo", enumProp: "enumMember", unionProp: "bar" });
    return {
      status: 200,
      body: json({ prop: "foo", enumProp: "enumMember", unionProp: "bar" }),
    };
  }),
);

Scenarios.Versioning_Added_API_Version_V2_V1 = passOnSuccess({
  uri: `/versioning/added/api-version:v2/v1`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: 10,
        },
        config: {
          headers: {
            "header-v2": "bar",
          },
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
          enumProp: "enumMemberV2",
          unionProp: 10,
        },
      },
    },
  ],
});

Scenarios.Versioning_Added_API_Version_V2_V2 = passOnSuccess({
  uri: `/versioning/added/api-version:v2/v2`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar",
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar",
        },
      },
    },
  ],
});

Scenarios.Versioning_Added_API_Version_V2_Interface_V2_V2 = passOnSuccess({
  uri: `/versioning/added/api-version:v2/interface-v2/v2`,
  mockMethods: [
    {
      method: `post`,
      request: {
        body: {
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar",
        },
      },
      response: {
        status: 200,
        data: {
          prop: "foo",
          enumProp: "enumMember",
          unionProp: "bar",
        },
      },
    },
  ],
});
