import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createGetServerTests(uri: string) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

function createPostServerTests(uri: string, requestBody: unknown, responseBody?: unknown) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json(requestBody),
    },
    response: {
      status: 200,
      body: responseBody ? json(responseBody) : undefined,
    },
    kind: "MockApiDefinition",
  });
}

// Lists namespace tests
Scenarios.Documentation_Lists_bulletPointsOp = createGetServerTests(
  "/documentation/lists/bullet-points/op",
);

Scenarios.Documentation_Lists_bulletPointsModel = createPostServerTests(
  "/documentation/lists/bullet-points/model",
  {
    prop: "Simple",
  },
);

Scenarios.Documentation_Lists_numbered = createGetServerTests("/documentation/lists/numbered");

// TextFormatting namespace tests
Scenarios.Documentation_TextFormatting_boldText = createGetServerTests(
  "/documentation/text-formatting/bold",
);

Scenarios.Documentation_TextFormatting_italicText = createGetServerTests(
  "/documentation/text-formatting/italic",
);

Scenarios.Documentation_TextFormatting_combinedFormatting = createGetServerTests(
  "/documentation/text-formatting/combined",
);
