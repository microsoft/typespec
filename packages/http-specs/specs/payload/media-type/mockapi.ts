import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_MediaType_String_Body_SendAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsText",
  mockMethods: [
    {
      method: "post",
      request: {
        body: "{cat}",
        headers: {
          "Content-Type": "text/plain",
        },
      },
      response: {
        status: 200,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("content-type", "text/plain");
        req.expect.bodyEquals("{cat}");
        return { status: 200 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_String_Body_GetAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsText",
  mockMethods: [
    {
      method: "get",
      request: {
        headers: {
          accept: "text/plain",
        },
      },
      response: {
        status: 200,
        body: "{cat}",
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("accept", "text/plain");
        return {
          status: 200,
          body: { rawContent: "{cat}", contentType: "text/plain" },
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_String_Body_SendAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsJson",
  mockMethods: [
    {
      method: "post",
      request: {
        body: "foo",
        headers: {
          "Content-Type": "application/json",
        },
      },
      response: {
        status: 200,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("content-type", "application/json");
        req.expect.bodyEquals("foo");
        return { status: 200 };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_String_Body_GetAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsJson",
  mockMethods: [
    {
      method: "get",
      request: {
        headers: {
          accept: "application/json",
        },
      },
      response: {
        status: 200,
        body: "foo",
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("accept", "application/json");
        return {
          status: 200,
          body: json("foo"),
          contentType: "application/json",
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});
