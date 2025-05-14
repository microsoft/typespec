import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getXmlEncoding } from "../src/encoding.js";
import { Tester } from "./test-host.js";

describe("default encodings", () => {
  it.each([
    ["utcDateTime", "TypeSpec.Xml.Encoding.xmlDateTime"],
    ["offsetDateTime", "TypeSpec.Xml.Encoding.xmlDateTime"],
    ["duration", "TypeSpec.Xml.Encoding.xmlDuration"],
    ["plainDate", "TypeSpec.Xml.Encoding.xmlDate"],
    ["plainTime", "TypeSpec.Xml.Encoding.xmlTime"],
    ["bytes", "TypeSpec.Xml.Encoding.xmlBase64Binary"],
  ])("%s", async (type, expectedEncoding) => {
    const { prop, program } = await Tester.compile(t.code`model Foo {
      ${t.modelProperty("prop")}: ${type}
    }`);
    const encoding = getXmlEncoding(program, prop);
    expect(encoding?.encoding).toEqual(expectedEncoding);
  });
});

it("override encoding", async () => {
  const { prop, program } = await Tester.compile(t.code`model Foo {
    @encode("rfc3339")
    ${t.modelProperty("prop")}: utcDateTime;
  }`);
  const encoding = getXmlEncoding(program, prop);
  expect(encoding?.encoding).toEqual("rfc3339");
});
