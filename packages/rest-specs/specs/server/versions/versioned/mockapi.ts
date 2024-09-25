import { mockapi, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Versions_Versioned_withoutApiVersion = passOnSuccess(
  mockapi.head("/server/versions/versioned/without-api-version", (req) => {
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

Scenarios.Server_Versions_Versioned_withQueryApiVersion = passOnSuccess(
  mockapi.head("/server/versions/versioned/with-query-api-version", (req) => {
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    return { status: 200 };
  }),
);

Scenarios.Server_Versions_Versioned_withPathApiVersion = passOnSuccess(
  mockapi.head("/server/versions/versioned/with-path-api-version/2022-12-01-preview", (req) => {
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

Scenarios.Server_Versions_Versioned_withQueryOldApiVersion = passOnSuccess(
  mockapi.head("/server/versions/versioned/with-query-old-api-version", (req) => {
    req.expect.containsQueryParam("api-version", "2021-01-01-preview");
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

Scenarios.Server_Versions_Versioned_Without_API_Version = createServerTests(
  "/server/versions/versioned/without-api-version",
);
Scenarios.Server_Versions_Versioned_With_Path_API_Version = createServerTests(
  "/server/versions/versioned/with-path-api-version/2022-12-01-preview",
);

Scenarios.Server_Versions_Versioned_With_Query_API_Version = createServerTests(
  "/server/versions/versioned/with-query-api-version",
  {
    config: {
      params: {
        "api-version": "2022-12-01-preview",
      },
    },
  },
);

Scenarios.Server_Versions_Versioned_With_Query_Old_API_Version = createServerTests(
  "/server/versions/versioned/with-query-old-api-version",
  {
    config: {
      params: {
        "api-version": "2021-01-01-preview",
      },
    },
  },
);
