import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createTests(uri: string, value: any) {
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
      body: json({ value }),
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Numeric_Property_safeintAsString = createTests(
  "/encode/numeric/property/safeint",
  "10000000000",
);
Scenarios.Encode_Numeric_Property_uint32AsStringOptional = createTests(
  "/encode/numeric/property/uint32",
  "1",
);
Scenarios.Encode_Numeric_Property_uint8AsString = createTests(
  "/encode/numeric/property/uint8",
  "255",
);
