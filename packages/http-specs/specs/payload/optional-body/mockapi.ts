import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_OptionalBody_set = passOnSuccess({
  uri: "/payload/optional-body/set",
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
});

Scenarios.Payload_OptionalBody_omit = passOnSuccess({
  uri: "/payload/optional-body/omit",
  method: "post",
  request: {},
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    req.expect.rawBodyEquals(undefined);
    req.expect.deepEqual(req.headers["content-type"], undefined, "Expected no content-type header");
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});
