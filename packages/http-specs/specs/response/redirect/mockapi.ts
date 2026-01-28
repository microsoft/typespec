import { passOnSuccess, ScenarioMockApi, MockApiDefinition } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validRedirect302: MockApiDefinition = {
  uri: "/response/redirect/302",
  method: "get",
  request: {},
  response: {
    status: 302,
    headers: {
      location: "/redirected",
    },
  },
  kind: "MockApiDefinition",
};

Scenarios.Response_Redirect_redirect302 = passOnSuccess(validRedirect302);
