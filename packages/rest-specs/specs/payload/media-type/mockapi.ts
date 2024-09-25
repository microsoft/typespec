import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_MediaType_StringBody_sendAsText = passOnSuccess(
  mockapi.post("/payload/media-type/string-body/sendAsText", (req) => {
    req.expect.containsHeader("content-type", "text/plain");
    req.expect.bodyEquals("{cat}");
    return { status: 200 };
  }),
);

Scenarios.Payload_MediaType_StringBody_getAsText = passOnSuccess(
  mockapi.get("/payload/media-type/string-body/getAsText", (req) => {
    req.expect.containsHeader("accept", "text/plain");
    return {
      status: 200,
      body: { rawContent: "{cat}", contentType: "text/plain" },
    };
  }),
);

Scenarios.Payload_MediaType_StringBody_sendAsJson = passOnSuccess(
  mockapi.post("/payload/media-type/string-body/sendAsJson", (req) => {
    req.expect.containsHeader("content-type", "application/json");
    req.expect.bodyEquals("foo");
    return { status: 200 };
  }),
);

Scenarios.Payload_MediaType_StringBody_getAsJson = passOnSuccess(
  mockapi.get("/payload/media-type/string-body/getAsJson", (req) => {
    req.expect.containsHeader("accept", "application/json");
    return {
      status: 200,
      body: json("foo"),
      contentType: "application/json",
    };
  }),
);

Scenarios.Payload_MediaType_String_Body_SendAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsText",
  mockMethods: [
    {
      method: "post",
      request: {
        body: "{cat}",
        config: {
          headers: {
            "Content-Type": "text/plain",
          },
        },
      },
      response: {
        status: 200,
      },
    },
  ],
});

Scenarios.Payload_MediaType_String_Body_GetAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsText",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "text/plain",
          },
        },
      },
      response: {
        status: 200,
        data: "{cat}",
      },
    },
  ],
});

Scenarios.Payload_MediaType_String_Body_SendAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsJson",
  mockMethods: [
    {
      method: "post",
      request: {
        body: "foo",
        config: {
          headers: {
            "Content-Type": "application/json",
          },
        },
      },
      response: {
        status: 200,
      },
    },
  ],
});

Scenarios.Payload_MediaType_String_Body_GetAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsJson",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            accept: "application/json",
          },
        },
      },
      response: {
        status: 200,
        data: "foo",
      },
    },
  ],
});
