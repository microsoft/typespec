import {
  createTestHost,
  createTestWrapper,
  type BasicTestRunner,
} from "@typespec/compiler/testing";
import { getStreamOf } from "@typespec/streams";
import { StreamsTestLibrary } from "@typespec/streams/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { getContentTypes } from "../../src/content-types.js";
import { HttpTestLibrary } from "../../src/testing/index.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  const host = await createTestHost({
    libraries: [StreamsTestLibrary, HttpTestLibrary],
  });
  runner = createTestWrapper(host, {
    autoImports: [`@typespec/http/streams`],
    autoUsings: ["TypeSpec.Http.Streams"],
  });
});

describe("HttpStream", () => {
  it("sets streamOf, contentType, and body", async () => {
    const { Foo, Message } = await runner.compile(`
      @test
      model Message { id: string, text: string }

      @test model Foo is HttpStream<Type = Message, ContentType = "application/jsonl">;
    `);
    assert(Foo.kind === "Model");
    assert(Message.kind === "Model");

    expect(getStreamOf(runner.program, Foo)).toBe(Message);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["application/jsonl"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});

describe("JsonlStream", () => {
  it("sets streamOf, contentType ('application/jsonl'), and body", async () => {
    const { Foo, Message } = await runner.compile(`
      @test
      model Message { id: string, text: string }

      @test model Foo is JsonlStream<Type = Message>;
    `);
    assert(Foo.kind === "Model");
    assert(Message.kind === "Model");

    expect(getStreamOf(runner.program, Foo)).toBe(Message);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["application/jsonl"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});
