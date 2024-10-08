import type { BasicTestRunner } from "@typespec/compiler/testing";
import { getContentTypes } from "@typespec/http";
import { getStreamOf } from "@typespec/streams";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { createSSETestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createSSETestRunner();
});

describe("SSEStream", () => {
  it("sets streamOf, contentType ('text/event-stream'), and body", async () => {
    const { Foo, TestEvents } = await runner.compile(`
      @test
      @events
      union TestEvents { 
        foo: string,

        bar: string,
      }

      @test model Foo is SSEStream<TestEvents>;
    `);
    assert(Foo.kind === "Model");
    assert(TestEvents.kind === "Union");

    expect(getStreamOf(runner.program, Foo)).toBe(TestEvents);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["text/event-stream"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});
