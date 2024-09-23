import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_BodyOptionality_requiredExplicit = passOnSuccess(
  mockapi.post("/parameters/body-optionality/required-explicit", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_BodyOptionality_OptionalExplicit = passOnSuccess([
  mockapi.post("/parameters/body-optionality/optional-explicit/set", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
  mockapi.post("/parameters/body-optionality/optional-explicit/omit", (req) => {
    req.expect.rawBodyEquals(undefined);
    return { status: 204 };
  }),
]);

Scenarios.Parameters_BodyOptionality_requiredImplicit = passOnSuccess(
  mockapi.post("/parameters/body-optionality/required-implicit", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

function createServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Parameters_Body_Optionality_Required_Explicit = createServerTests(
  "/parameters/body-optionality/required-explicit",
  {
    name: "foo",
  },
);

Scenarios.Parameters_Body_Optionality_Optional_Explicit_Set = createServerTests(
  "/parameters/body-optionality/optional-explicit/set",
  {
    name: "foo",
  },
);

Scenarios.Parameters_Body_Optionality_Optional_Explicit_Omit = passOnSuccess({
  uri: "/parameters/body-optionality/optional-explicit/omit",
  mockMethods: [
    {
      method: "post",
      request: {},
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Body_Optionality_Required_Implicit = createServerTests(
  "/parameters/body-optionality/required-implicit",
  {
    name: "foo",
  },
);
