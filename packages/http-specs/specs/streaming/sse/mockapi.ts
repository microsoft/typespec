import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const basicStream = ['data: {"desc": "one"}', 'data: {"desc": "two"}', 'data: {"desc": "three"}']
  .map((event) => `${event}\n\n`)
  .join("");

Scenarios.Streaming_Sse_Basic_receive = passOnSuccess({
  uri: "/streaming/sse/basic/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: Buffer.from(basicStream),
      contentType: "text/event-stream",
    },
  },
  kind: "MockApiDefinition",
});

const namedStream = [
  'event: responseCreated\ndata: {"id": "resp_1"}',
  'event: responseDelta\ndata: {"delta": "Hello"}',
  'event: responseDelta\ndata: {"delta": " world"}',
  "data: [DONE]",
]
  .map((event) => `${event}\n\n`)
  .join("");

Scenarios.Streaming_Sse_Named_receive = passOnSuccess({
  uri: "/streaming/sse/named/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: Buffer.from(namedStream),
      contentType: "text/event-stream",
    },
  },
  kind: "MockApiDefinition",
});

const retrieveStream = [
  'event: partialResult\ndata: {"text": "partial one"}',
  'event: partialResult\ndata: {"text": "partial two"}',
  'event: finalResult\ndata: {"references": ["doc1", "doc2"]}',
  "data: [DONE]",
]
  .map((event) => `${event}\n\n`)
  .join("");

Scenarios.Streaming_Sse_Retrieve_stream = passOnSuccess({
  uri: "/streaming/sse/retrieve/stream",
  method: "post",
  request: {
    body: {
      rawContent: JSON.stringify({ query: "what is typespec?" }),
      contentType: "application/json",
    },
  },
  response: {
    status: 200,
    body: {
      rawContent: Buffer.from(retrieveStream),
      contentType: "text/event-stream",
    },
  },
  kind: "MockApiDefinition",
});
