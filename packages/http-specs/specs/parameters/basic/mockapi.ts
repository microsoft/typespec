import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
function createServerTests(uri: string) {
  return passOnSuccess({
    uri,
    method: "put",
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
    kind: "MockApiDefinition",
  });
}

Scenarios.Parameters_Basic_ExplicitBody_simple = createServerTests(
  "/parameters/basic/explicit-body/simple",
);
Scenarios.Parameters_Basic_ImplicitBody_simple = createServerTests(
  "/parameters/basic/implicit-body/simple",
);
