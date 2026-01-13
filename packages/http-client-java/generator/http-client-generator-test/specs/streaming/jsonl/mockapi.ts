import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Streaming_Jsonl_Basic_send = passOnSuccess({
  uri: "/streaming/jsonl/basic/send",
  method: "post",
  request: {
    body: {
      rawContent: Buffer.from('{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'),
      contentType: "application/jsonl",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Streaming_Jsonl_Basic_receive = passOnSuccess({
  uri: "/streaming/jsonl/basic/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: Buffer.from('{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'),
      contentType: "application/jsonl",
    },
  },
  kind: "MockApiDefinition",
});
