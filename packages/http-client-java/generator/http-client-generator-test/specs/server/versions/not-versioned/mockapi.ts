import { MockRequest, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(uri: string, requestData?: any) {
  let requestObject: any;
  if (requestData) {
    requestObject = requestData;
  } else {
    requestObject = {};
  }
  return passOnSuccess({
    uri,
    method: "head",
    request: requestObject,
    response: {
      status: 200,
    },
    handler: (req: MockRequest) => {
      if (Object.keys(req.query).length > 0) {
        throw new ValidationError(
          "Expected no query parameters including api-version",
          "No query parameters",
          req.query,
        );
      }
      return { status: 200 };
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Server_Versions_NotVersioned_withoutApiVersion = createServerTests(
  "/server/versions/not-versioned/without-api-version",
);
Scenarios.Server_Versions_NotVersioned_withPathApiVersion = createServerTests(
  "/server/versions/not-versioned/with-path-api-version/v1.0",
);
Scenarios.Server_Versions_NotVersioned_withQueryApiVersion = passOnSuccess({
  uri: "/server/versions/not-versioned/with-query-api-version",
  method: "head",
  request: {
    query: {
      "api-version": "v1.0",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});
