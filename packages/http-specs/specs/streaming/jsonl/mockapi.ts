import type { ScenarioMockApi } from "@typespec/spec-api";
import { passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Streaming_Jsonl_Basic_send = passOnSuccess({
  uri: "/streaming/jsonl/basic/send",
  method: "post",
  request: {
    headers: {
      "content-type": "application/jsonl",
    },
  },
  response: {
    status: 204,
  },
  handler: (req) => {
    const rawBody = req.originalRequest.rawBody;
    const content = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const values = content
      ?.trimEnd()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    req.expect.deepEqual(values, [{ desc: "one" }, { desc: "two" }, { desc: "three" }]);
    return { status: 204 };
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
