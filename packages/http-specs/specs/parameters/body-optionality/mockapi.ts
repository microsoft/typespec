import {
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

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

Scenarios.Parameters_BodyOptionality_ContentTypeHeader = passOnSuccess([
  {
    uri: "/parameters/body-optionality/content-type/set",
    method: "post",
    request: {
      body: json({
        name: "foo",
      }),
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      // Validate that Content-Type header is present when body is provided
      if (!req.headers["content-type"]) {
        throw new ValidationError(
          "Content-Type header is required when body is provided",
          "content-type header present",
          "content-type header missing",
        );
      }
      return { status: 204 };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/parameters/body-optionality/content-type/omit",
    method: "post",
    request: {},
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      // Validate that Content-Type header is NOT present when body is omitted
      req.expect.rawBodyEquals(undefined);
      if (req.headers["content-type"]) {
        throw new ValidationError(
          "Content-Type header must NOT be present when body is omitted",
          "no content-type header",
          `content-type: ${req.headers["content-type"]}`,
        );
      }
      return { status: 204 };
    },
    kind: "MockApiDefinition",
  },
]);
