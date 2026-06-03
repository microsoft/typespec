import { createMatcher, err, json, ok, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createCaseInsensitiveBooleanMatcher(value: boolean) {
  const normalized = String(value);
  return createMatcher<string>({
    check: (actual) => {
      if (typeof actual !== "string") {
        return err(`Expected string "${normalized}" but got ${typeof actual}`);
      }
      return actual.toLowerCase() === normalized
        ? ok()
        : err(`Expected case-insensitive "${normalized}" but got "${actual}"`);
    },
    serialize: () => normalized,
  });
}

function createBodyServerTests(uri: string, responseValue: string, requestValue: boolean) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({
        value: createCaseInsensitiveBooleanMatcher(requestValue),
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
