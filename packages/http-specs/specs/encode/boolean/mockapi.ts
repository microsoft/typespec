import { json, match, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createBodyServerTests(uri: string, responseValue: string, requestValue: boolean) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({
        value: match.boolean.caseInsensitiveString(requestValue),
      }),
    },
    response: {
      status: 200,
      body: json({
        value: responseValue,
      }),
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Encode_Boolean_Property_trueLower = createBodyServerTests(
  "/encode/boolean/property/true-lower",
  "true",
  true,
);
Scenarios.Encode_Boolean_Property_falseLower = createBodyServerTests(
  "/encode/boolean/property/false-lower",
  "false",
  false,
);
Scenarios.Encode_Boolean_Property_trueUpper = createBodyServerTests(
  "/encode/boolean/property/true-upper",
  "TRUE",
  true,
);
Scenarios.Encode_Boolean_Property_falseMixed = createBodyServerTests(
  "/encode/boolean/property/false-mixed",
  "FaLsE",
  false,
);
