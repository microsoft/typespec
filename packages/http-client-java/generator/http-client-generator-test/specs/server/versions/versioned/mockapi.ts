import { MockRequest, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(uri: string) {
  return passOnSuccess({
    uri,
    method: "head",
    request: {},
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

Scenarios.Server_Versions_Versioned_withoutApiVersion = createServerTests(
  "/server/versions/versioned/without-api-version",
);
Scenarios.Server_Versions_Versioned_withPathApiVersion = createServerTests(
  "/server/versions/versioned/with-path-api-version/2022-12-01-preview",
);

function createAPIVersionTests(uri: string, version: string) {
  return passOnSuccess({
    uri,
    method: "head",
    request: {
      query: {
        "api-version": version,
      },
    },
    response: {
      status: 200,
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Server_Versions_Versioned_withQueryOldApiVersion = createAPIVersionTests(
  "/server/versions/versioned/with-query-old-api-version",
  "2021-01-01-preview",
);

Scenarios.Server_Versions_Versioned_withQueryApiVersion = createAPIVersionTests(
  "/server/versions/versioned/with-query-api-version",
  "2022-12-01-preview",
);
