import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Basic_ExplicitBody_simple = passOnSuccess(
  mockapi.put("/parameters/basic/explicit-body/simple", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

Scenarios.Parameters_Basic_ImplicitBody_simple = passOnSuccess(
  mockapi.put("/parameters/basic/implicit-body/simple", (req) => {
    req.expect.bodyEquals({ name: "foo" });
    return { status: 204 };
  }),
);

function createServerTests(uri: string) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "put",
        request: {
          body: {
            name: "foo",
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Parameters_Basic_ExplicitBody_simple_server = createServerTests("/parameters/basic/explicit-body/simple");
Scenarios.Parameters_Basic_ImplicitBody_simple_server = createServerTests("/parameters/basic/implicit-body/simple");
