import { t } from "@typespec/compiler/testing";
import { getStreamOf } from "@typespec/streams";
import { describe, expect, it } from "vitest";
import { getContentTypes } from "../../src/content-types.js";
import { StreamsTester } from "./tester.js";

describe("HttpStream", () => {
  it("sets streamOf, contentType, and body", async () => {
    const { Foo, Message, program } = await StreamsTester.compile(t.code`
      model ${t.model("Message")} { id: string, text: string }

      model ${t.model("Foo")} is HttpStream<Type = Message, ContentType = "application/jsonl">;
    `);

    expect(getStreamOf(program, Foo)).toBe(Message);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["application/jsonl"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});

describe("JsonlStream", () => {
  it("sets streamOf, contentType ('application/jsonl'), and body", async () => {
    const { Foo, Message, program } = await StreamsTester.compile(t.code`
      model ${t.model("Message")} { id: string, text: string }

      model ${t.model("Foo")} is JsonlStream<Type = Message>;
    `);

    expect(getStreamOf(program, Foo)).toBe(Message);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["application/jsonl"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });
});
