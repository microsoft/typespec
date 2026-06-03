import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createBodyServerTests(uri: string, value: string) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({
        value,
      }),
    },
    response: {
      status: 200,
      body: json({
        value,
      }),
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Encode_Boolean_Property_trueLower = createBodyServerTests(
  "/encode/boolean/property/true-lower",
  "true",
);
Scenarios.Encode_Boolean_Property_falseLower = createBodyServerTests(
  "/encode/boolean/property/false-lower",
  "false",
);
Scenarios.Encode_Boolean_Property_trueUpper = createBodyServerTests(
  "/encode/boolean/property/true-upper",
  "TRUE",
);
Scenarios.Encode_Boolean_Property_falseMixed = createBodyServerTests(
  "/encode/boolean/property/false-mixed",
  "FaLsE",
);
