import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
function createServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethod: {
      method: "post",
      request: {
        body: data,
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
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
    mockMethod: {
      method: "post",
      request: {
        body: {
          name: "foo",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/parameters/body-optionality/optional-explicit/omit",
    mockMethod: {
      method: "post",
      request: {
        body: {
          name: "foo",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ name: "foo" });
        return { status: 204 };
      },
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
