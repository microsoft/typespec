import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Streaming_Jsonl_AsBinary_send = passOnSuccess({
  uri: "/streaming/jsonl/as-binary/send",
  method: "post",
  request: {
    headers: {
      "Content-Type": "application/jsonl",
    },
    body: Buffer.from('{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Streaming_Jsonl_AsBinary_receive = passOnSuccess({
  uri: "/streaming/jsonl/as-binary/receive",
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
