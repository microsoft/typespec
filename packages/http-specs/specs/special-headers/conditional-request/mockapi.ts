import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.SpecialHeaders_ConditionalRequest_postIfUnmodifiedSince = passOnSuccess({
  uri: "/special-headers/conditional-request/if-unmodified-since",
  method: "post",
  request: {
    headers: {
      "if-unmodified-since": "Fri, 26 Aug 2022 14:38:00 GMT",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.SpecialHeaders_ConditionalRequest_headIfModifiedSince = passOnSuccess({
  uri: "/special-headers/conditional-request/if-modified-since",
  method: "head",
  request: {
    headers: {
      "if-modified-since": "Fri, 26 Aug 2022 14:38:00 GMT",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.SpecialHeaders_ConditionalRequest_postIfMatch = passOnSuccess({
  uri: "/special-headers/conditional-request/if-match",
  method: "post",
  request: {
    headers: {
      "if-match": '"valid"',
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.SpecialHeaders_ConditionalRequest_postIfNoneMatch = passOnSuccess({
  uri: "/special-headers/conditional-request/if-none-match",
  method: "post",
  request: {
    headers: {
      "if-none-match": '"invalid"',
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
