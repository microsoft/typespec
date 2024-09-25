import { json, mockapi, MockApi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createPropertyMockApis(route: string, value: string): MockApi {
  const url = `/encode/numeric/property/${route}`;
  return mockapi.post(url, (req) => {
    req.expect.coercedBodyEquals({ value: value });
    return {
      status: 200,
      body: json({ value: value }),
    };
  });
}

Scenarios.Encode_Numeric_Property_safeintAsString = passOnSuccess(
  createPropertyMockApis("safeint", "10000000000"),
);

Scenarios.Encode_Numeric_Property_uint32AsStringOptional = passOnSuccess(
  createPropertyMockApis("uint32", "1"),
);

Scenarios.Encode_Numeric_Property_uint8AsString = passOnSuccess(
  createPropertyMockApis("uint8", "255"),
);

Scenarios.Encode_Numeric_Property_Safeint = passOnSuccess({
  uri: "/encode/numeric/property/safeint",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          value: "10000000000",
        },
      },
      response: {
        status: 200,
        data: { value: "10000000000" },
      },
    },
  ],
});

Scenarios.Encode_Numeric_Property_Uint32 = passOnSuccess({
  uri: "/encode/numeric/property/uint32",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          value: "1",
        },
      },
      response: {
        status: 200,
        data: { value: "1" },
      },
    },
  ],
});
