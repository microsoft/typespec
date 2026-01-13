import { MockApiDefinition } from "@typespec/spec-api";

export function createServerTests(uri: string): MockApiDefinition {
  return {
    uri: uri,
    method: "post",
    request: {},
    response: { status: 204 },
    kind: "MockApiDefinition",
  };
}
