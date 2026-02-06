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

Scenarios.Encode_Array_Property_enumCommaDelimited = createPropertyServerTests(
  "/encode/array/property/enum/comma-delimited",
  ",",
);

Scenarios.Encode_Array_Property_enumSpaceDelimited = createPropertyServerTests(
  "/encode/array/property/enum/space-delimited",
  " ",
);

Scenarios.Encode_Array_Property_enumPipeDelimited = createPropertyServerTests(
  "/encode/array/property/enum/pipe-delimited",
  "|",
);

Scenarios.Encode_Array_Property_enumNewlineDelimited = createPropertyServerTests(
  "/encode/array/property/enum/newline-delimited",
  "\n",
);

Scenarios.Encode_Array_Property_extensibleEnumCommaDelimited = createPropertyServerTests(
  "/encode/array/property/extensible-enum/comma-delimited",
  ",",
);

Scenarios.Encode_Array_Property_extensibleEnumSpaceDelimited = createPropertyServerTests(
  "/encode/array/property/extensible-enum/space-delimited",
  " ",
);

Scenarios.Encode_Array_Property_extensibleEnumPipeDelimited = createPropertyServerTests(
  "/encode/array/property/extensible-enum/pipe-delimited",
  "|",
);

Scenarios.Encode_Array_Property_extensibleEnumNewlineDelimited = createPropertyServerTests(
  "/encode/array/property/extensible-enum/newline-delimited",
  "\n",
);
