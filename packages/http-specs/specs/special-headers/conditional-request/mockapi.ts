import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.SpecialHeaders_ConditionalRequest_IfUnmodifiedSince = passOnSuccess({
  uri: "/special-headers/conditional-request/if-unmodified-since",
  mockMethods: [
    {
      method: "post",
      request: {
        headers: {
          "if-unmodified-since": "Fri, 26 Aug 2022 14:38:00 GMT",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("if-unmodified-since", "Fri, 26 Aug 2022 14:38:00 GMT");
        return {
          status: 204,
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.SpecialHeaders_ConditionalRequest_IfModifiedSince = passOnSuccess({
  uri: "/special-headers/conditional-request/if-modified-since",
  mockMethods: [
    {
      method: "head",
      request: {
        headers: {
          "if-modified-since": "Fri, 26 Aug 2022 14:38:00 GMT",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("if-modified-since", "Fri, 26 Aug 2022 14:38:00 GMT");
        return {
          status: 204,
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Special_Headers_Conditional_Request_If_Match = passOnSuccess({
  uri: "/special-headers/conditional-request/if-match",
  mockMethods: [
    {
      method: "post",
      request: {
        headers: {
          "if-match": '"valid"',
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("if-match", '"valid"');
        return {
          status: 204,
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Special_Headers_Conditional_Request_If_None_Match = passOnSuccess({
  uri: "/special-headers/conditional-request/if-none-match",
  mockMethods: [
    {
      method: "post",
      request: {
        headers: {
          "if-none-match": '"invalid"',
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("if-none-match", '"invalid"');
        return {
          status: 204,
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
