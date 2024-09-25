import { mockapi, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Versions_NotVersioned_withoutApiVersion = passOnSuccess(
  mockapi.head("/server/versions/not-versioned/without-api-version", (req) => {
    if (Object.keys(req.query).length > 0) {
      throw new ValidationError(
        "Expected no query parameters including api-version",
        "No query parameters",
        req.query,
      );
    }
    return { status: 200 };
  }),
);

Scenarios.Server_Versions_NotVersioned_withQueryApiVersion = passOnSuccess(
  mockapi.head("/server/versions/not-versioned/with-query-api-version", (req) => {
    req.expect.containsQueryParam("api-version", "v1.0");
    return { status: 200 };
  }),
);

Scenarios.Server_Versions_NotVersioned_withPathApiVersion = passOnSuccess(
  mockapi.head("/server/versions/not-versioned/with-path-api-version/v1.0", (req) => {
    if (Object.keys(req.query).length > 0) {
      throw new ValidationError(
        "Expected no query parameters including api-version",
        "No query parameters",
        req.query,
      );
    }
    return { status: 200 };
  }),
);

function createServerTests(uri: string, requestData?: any) {
  let requestObject: any;
  if (requestData) {
    requestObject = requestData;
  } else {
    requestObject = {};
  }
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "head",
        request: requestObject,
        response: {
          status: 200,
        },
      },
    ],
  });
}

Scenarios.Server_Versions_Not_Versioned_Without_API_Version = createServerTests(
  "/server/versions/not-versioned/without-api-version",
);
Scenarios.Server_Versions_Not_Versioned_With_Path_API_Version = createServerTests(
  "/server/versions/not-versioned/with-path-api-version/v1.0",
);
Scenarios.Server_Versions_Not_Versioned_With_Query_API_Version = passOnSuccess({
  uri: "/server/versions/not-versioned/with-query-api-version",
  mockMethods: [
    {
      method: "head",
      request: {
        config: {
          params: {
            "api-version": "v1.0",
          },
        },
      },
      response: {
        status: 200,
      },
    },
  ],
});
