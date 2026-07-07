import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { camelToSnakeCase, md2Rst, quoteShellArg } from "../src/utils.js";

describe("typespec-python: utils", () => {
  it("camelToSnakeCase", async () => {
    const cases = {
      StandardSSD: "standard_ssd",
      StandardSSDLRS: "standard_ssdlrs",
      QRCode: "qr_code",
      MicroQRCode: "micro_qr_code",
      detection_01: "detection01",
      "v1.1-preview.1": "v1_1_preview1",
      pointInTimeUTC: "point_in_time_utc",
      diskSizeGB: "disk_size_gb",
      lastModifiedTS: "last_modified_ts",
      "FOO-BAR": "foo_bar",
      "FOO-BAR-BAZ": "foo_bar_baz",
      "A-B": "a_b",
    };
    for (const [input, expected] of Object.entries(cases)) {
      strictEqual(camelToSnakeCase(input), expected);
    }
  });

  it("md2rst", async () => {
    const des = "Format: <MajorVersion>.<MinorVersion>.<Patch>";
    strictEqual(md2Rst(des), "Format: <MajorVersion>.<MinorVersion>.<Patch>");
  });

  it("quoteShellArg wraps values in double quotes without doubling existing content", async () => {
    // Regression test for https://github.com/microsoft/typespec Python SDK generation failure
    // where a package-pprint-name with spaces (e.g. "Azure Web PubSub Chat Service") got quotes
    // baked into the option value and then leaked into the generated setup.py as doubled quotes.
    strictEqual(quoteShellArg("Azure Web PubSub Chat Service"), '"Azure Web PubSub Chat Service"');
    strictEqual(quoteShellArg("simple"), '"simple"');
    strictEqual(quoteShellArg('has "quotes"'), '"has \\"quotes\\""');
    strictEqual(quoteShellArg("trailing\\"), '"trailing\\\\"');
    strictEqual(quoteShellArg('back\\slash "q"'), '"back\\\\slash \\"q\\""');
  });
});
