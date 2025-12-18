import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const colors = ["blue", "red", "green"];

function createPropertyServerTests(uri: string, delimiter: string) {
  const encodedValue = colors.join(delimiter);
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({
        value: encodedValue,
      }),
    },
    response: {
      status: 200,
      body: json({ value: encodedValue }),
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Encode_Array_Property_commaDelimited = createPropertyServerTests(
  "/encode/array/property/comma-delimited",
  ",",
);

Scenarios.Encode_Array_Property_spaceDelimited = createPropertyServerTests(
  "/encode/array/property/space-delimited",
  " ",
);

Scenarios.Encode_Array_Property_pipeDelimited = createPropertyServerTests(
  "/encode/array/property/pipe-delimited",
  "|",
);

Scenarios.Encode_Array_Property_newlineDelimited = createPropertyServerTests(
  "/encode/array/property/newline-delimited",
  "\n",
);
