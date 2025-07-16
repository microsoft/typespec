import { t } from "@typespec/compiler/testing";
import { getContentTypes } from "@typespec/http";
import { getStreamOf } from "@typespec/streams";
import { describe, expect, it } from "vitest";
import { Tester } from "./test-host.js";

describe("SSEStream", () => {
  it("sets streamOf, contentType ('text/event-stream'), and body", async () => {
    const { Foo, TestEvents, program } = await Tester.compile(t.code`
      @events
      union ${t.union("TestEvents")} { 
        foo: string,

        bar: string,
      }

      model ${t.model("Foo")} is SSEStream<TestEvents>;
    `);
    expect(getStreamOf(program, Foo)).toBe(TestEvents);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["text/event-stream"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});
