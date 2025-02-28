import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Stream_Jsonl_send = passOnSuccess({
  uri: "/stream/jsonl/send",
  method: "post",
  request: {
    headers: {
      "Content-Type": "application/jsonl",
    },
    body: '{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}',
  },
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    req.expect.containsHeader("content-type", "application/jsonl");
    req.expect.rawBodyEquals('{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}');
    return {
      status: 204,
    };
  },
  kind: "MockApiDefinition",
});

Scenarios.Stream_Jsonl_receive = passOnSuccess({
  uri: "/stream/jsonl/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: '{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}',
      contentType: "application/jsonl",
    },
  },
  kind: "MockApiDefinition",
});
