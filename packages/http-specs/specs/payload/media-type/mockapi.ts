import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_MediaType_StringBody_sendAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsText",
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
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_getAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsText",
  method: "get",
  request: {
    headers: {
      accept: "text/plain",
    },
  },
  response: {
    status: 200,
    body: { rawContent: "{cat}", contentType: "text/plain" },
  },
  handler: (req: MockRequest) => {
    req.expect.containsHeader("accept", "text/plain");
    return {
      status: 200,
      body: { rawContent: "{cat}", contentType: "text/plain" },
    };
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_sendAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsJson",
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
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_getAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsJson",
  method: "get",
  request: {
    headers: {
      accept: "application/json",
    },
  },
  response: {
    status: 200,
    body: json("foo"),
  },
  handler: (req: MockRequest) => {
    req.expect.containsHeader("accept", "application/json");
    return {
      status: 200,
      body: json("foo"),
      contentType: "application/json",
    };
  },
  kind: "MockApiDefinition",
});
