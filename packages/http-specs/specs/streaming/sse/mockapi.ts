import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const unnamedStream = ['data: {"desc": "one"}', 'data: {"desc": "two"}', 'data: {"desc": "three"}']
  .map((event) => `${event}\n\n`)
  .join("");

Scenarios.Streaming_Sse_Unnamed_receive = passOnSuccess({
  uri: "/streaming/sse/unnamed/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: Buffer.from(unnamedStream),
      contentType: "text/event-stream",
    },
  },
  kind: "MockApiDefinition",
});

const namedChunks = [
  'event: responseCreated\ndata: {"id": "resp_1"}\n\n',
  'event: responseDelta\ndata: {"delta": "Hello"}\n\n',
  'event: responseDelta\ndata: {"delta": " world"}\n\n',
  "data: [DONE]\n\n",
].map((event) => Buffer.from(event));

Scenarios.Streaming_Sse_Named_receive = passOnSuccess({
  uri: "/streaming/sse/named/receive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      streamChunks: namedChunks,
      contentType: "text/event-stream",
      rawContent: Buffer.from(namedChunks.map((c) => c.toString()).join("")),
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
