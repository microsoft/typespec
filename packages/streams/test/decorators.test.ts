import type { Model } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { getStreamOf } from "../src/decorators.js";
import { createStreamsTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createStreamsTestRunner();
});

describe("@streamOf", () => {
  it("provides stream protocol type", async () => {
    const { Blob } = await runner.compile(`@test @streamOf(string) model Blob {}`);

    expect(getStreamOf(runner.program, Blob as Model)).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });

  it("returns undefined if model is not decorated", async () => {
    const { Blob } = await runner.compile(`@test model Blob {}`);

    expect(getStreamOf(runner.program, Blob as Model)).toBeUndefined();
  });

  it("is automatically set on the Stream model", async () => {
    const { CustomStream, Message } = await runner.compile(
      `
      @test model Message { id: string, text: string }
      @test model CustomStream is Stream<Message> {}`,
    );

    expect(getStreamOf(runner.program, CustomStream as Model)).toBe(Message);
  });
});
