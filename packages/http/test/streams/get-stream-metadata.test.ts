import { expectDiagnosticEmpty, t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getStreamMetadata } from "../../src/experimental/index.js";
import { getAllHttpServices } from "../../src/operations.js";
import { StreamsTester } from "./tester.js";

async function getHttpServiceWithProgram(code: string) {
  const { Thing, program } = await StreamsTester.compile(t.code`
    model ${t.model("Thing")} { id: string }
    ${code}
  `);
  const [services, diagnostics] = getAllHttpServices(program);

  expectDiagnosticEmpty(diagnostics);
  return { service: services[0], Thing, program };
}

describe("Operation Responses", () => {
  it("can get stream metadata from HttpStream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(): HttpStream<Thing, "application/jsonl", string>;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.responses[0].responses[0]);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "HttpStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from JsonlStream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(): JsonlStream<Thing>;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.responses[0].responses[0]);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "JsonlStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from custom base Stream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @streamOf(Thing)
      model CustomStream {
        @header contentType: "custom/built-here";
        @body body: bytes;
      }

      @route("/")
      op get(): CustomStream;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.responses[0].responses[0]);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "bytes" });
    expect(streamMetadata?.contentTypes).toEqual(["custom/built-here"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "CustomStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from intersection with stream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(): JsonlStream<Thing> & { @statusCode statusCode: 204; };
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.responses[0].responses[0]);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "JsonlStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from each HttpResponseContent", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(): JsonlStream<Thing> | HttpStream<Thing, "custom/json", string>;
    `);

    const operation = service.operations[0];

    const jsonlStreamMetadata = getStreamMetadata(program, operation.responses[0].responses[0]);
    expect(jsonlStreamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(jsonlStreamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(jsonlStreamMetadata?.originalType).toMatchObject({ name: "JsonlStream" });
    expect(jsonlStreamMetadata?.streamType).toBe(Thing);

    const httpStreamMetadata = getStreamMetadata(program, operation.responses[0].responses[1]);
    expect(httpStreamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(httpStreamMetadata?.contentTypes).toEqual(["custom/json"]);
    expect(httpStreamMetadata?.originalType).toMatchObject({ name: "HttpStream" });
    expect(httpStreamMetadata?.streamType).toBe(Thing);
  });
});

describe("Operation Parameters", () => {
  it("can get stream metadata from HttpStream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(stream: HttpStream<Thing, "application/jsonl", string>): void;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.parameters);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "HttpStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from JsonlStream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(stream: JsonlStream<Thing>): void;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.parameters);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "JsonlStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from custom base Stream", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @streamOf(Thing)
      model CustomStream {
        @header contentType: "custom/built-here";
        @body body: bytes;
      }

      @route("/")
      op get(stream: CustomStream): void;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.parameters);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "bytes" });
    expect(streamMetadata?.contentTypes).toEqual(["custom/built-here"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "CustomStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });

  it("can get stream metadata from spread parameters", async () => {
    const { service, Thing, program } = await getHttpServiceWithProgram(`
      @route("/")
      op get(...JsonlStream<Thing>): void;
    `);

    const operation = service.operations[0];
    const streamMetadata = getStreamMetadata(program, operation.parameters);

    expect(streamMetadata?.bodyType).toMatchObject({ kind: "Scalar", name: "string" });
    expect(streamMetadata?.contentTypes).toEqual(["application/jsonl"]);
    expect(streamMetadata?.originalType).toMatchObject({ name: "JsonlStream" });
    expect(streamMetadata?.streamType).toBe(Thing);
  });
});
