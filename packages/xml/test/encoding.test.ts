import type { ModelProperty } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { getXmlEncoding } from "../src/encoding.js";
import { createXmlTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createXmlTestRunner();
});

describe("default encodings", () => {
  it.each([
    ["utcDateTime", "TypeSpec.Xml.Encoding.xmlDateTime"],
    ["offsetDateTime", "TypeSpec.Xml.Encoding.xmlDateTime"],
    ["duration", "TypeSpec.Xml.Encoding.xmlDuration"],
    ["plainDate", "TypeSpec.Xml.Encoding.xmlDate"],
    ["plainTime", "TypeSpec.Xml.Encoding.xmlTime"],
    ["bytes", "TypeSpec.Xml.Encoding.xmlBase64Binary"],
  ])("%s", async (type, expectedEncoding) => {
    const { prop } = (await runner.compile(`model Foo {
      @test prop: ${type}
    }`)) as { prop: ModelProperty };
    const encoding = getXmlEncoding(runner.program, prop);
    expect(encoding?.encoding).toEqual(expectedEncoding);
  });
});

it("override encoding", async () => {
  const { prop } = (await runner.compile(`model Foo {
    @encode("rfc3339")
    @test prop: utcDateTime;
  }`)) as { prop: ModelProperty };
  const encoding = getXmlEncoding(runner.program, prop);
  expect(encoding?.encoding).toEqual("rfc3339");
});
