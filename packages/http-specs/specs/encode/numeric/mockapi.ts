import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createTests(uri: string, value: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: {
            value,
          },
        },
        response: {
          status: 200,
          body: json({ value }),
        },
        handler: (req: MockRequest) => {
          req.expect.coercedBodyEquals({ value });
          return {
            status: 200,
            body: json({ value }),
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Numeric_Property_Safeint = createTests(
  "/encode/numeric/property/safeint",
  "10000000000",
);
Scenarios.Encode_Numeric_Property_Uint32 = createTests("/encode/numeric/property/uint32", "1");
Scenarios.Encode_Numeric_Property_Uint8 = createTests("/encode/numeric/property/uint8", "255");
