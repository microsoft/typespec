import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
function createServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json(data),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Parameters_BodyOptionality_requiredExplicit = createServerTests(
  "/parameters/body-optionality/required-explicit",
  {
    name: "foo",
  },
);

Scenarios.Parameters_BodyOptionality_OptionalExplicit = passOnSuccess([
  {
    uri: "/parameters/body-optionality/optional-explicit/set",
    method: "post",
    request: {
      body: json({
        name: "foo",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/parameters/body-optionality/optional-explicit/omit",
    method: "post",
    request: {},
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.rawBodyEquals(undefined);
      return { status: 204 };
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Parameters_BodyOptionality_requiredImplicit = createServerTests(
  "/parameters/body-optionality/required-implicit",
  {
    name: "foo",
  },
);
