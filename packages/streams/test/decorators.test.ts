import type { Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getStreamOf } from "../src/decorators.js";
import { Tester } from "./test-host.js";

describe("@streamOf", () => {
  it("provides stream protocol type", async () => {
    const { Blob, program } = await Tester.compile(t.code`
      @streamOf(string)
      model ${t.model("Blob")} {}
    `);

    expect(getStreamOf(program, Blob as Model)).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });

  it("returns undefined if model is not decorated", async () => {
    const { Blob, program } = await Tester.compile(t.code`
      model ${t.model("Blob")} {}
    `);

    expect(getStreamOf(program, Blob as Model)).toBeUndefined();
  });

  it("is automatically set on the Stream model", async () => {
    const { CustomStream, Message, program } = await Tester.compile(t.code`
      model ${t.model("Message")} { id: string, text: string }
      model ${t.model("CustomStream")} is Stream<Message> {}
    `);

    expect(getStreamOf(program, CustomStream as Model)).toBe(Message);
  });
});
