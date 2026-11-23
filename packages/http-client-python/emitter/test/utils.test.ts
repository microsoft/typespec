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
      detection_01: "detection_01",
      "v1.1-preview.1": "v1_1_preview_1",
      pointInTimeUTC: "point_in_time_utc",
      diskSizeGB: "disk_size_gb",
      lastModifiedTS: "last_modified_ts",
      "FOO-BAR": "foo_bar",
      "FOO-BAR-BAZ": "foo_bar_baz",
      "A-B": "a_b",
      // Fix for GitHub issue #10312: preserve underscores before numbers (dates)
      WebSearchPreview_2025_03_11: "web_search_preview_2025_03_11",
      Default_2024_11_15: "default_2024_11_15",
      // Fix for GitHub issue #10312: don't insert underscores around single digits in acronyms
      A2a: "a2a",
    };
    for (const [input, expected] of Object.entries(cases)) {
      strictEqual(camelToSnakeCase(input), expected);
    }
  });

  it.each([
    ["int32", "int32"],
    ["uint8", "uint8"],
    ["uint32", "uint32"],
    ["float32", "float32"],
    ["float64", "float64"],
    ["int32Property", "int32_property"],
    ["float32Property", "float32_property"],
    ["int32MillisecondsArray", "int32_milliseconds_array"],
    ["uint32AsStringOptional", "uint32_as_string_optional"],
    ["base64", "base64"],
    ["base64url", "base64_url"],
    ["base64urlArray", "base64_url_array"],
    ["iso8601", "iso8601"],
    ["rfc3339", "rfc3339"],
    ["rfc7231", "rfc7231"],
    ["two6k", "two6_k"],
    ["subscriptionResource1Name", "subscription_resource1_name"],
    ["subscriptionResource2Name", "subscription_resource2_name"],
    ["InterfaceV2", "interface_v2"],
    ["v2InInterface", "v2_in_interface"],
    ["enumMemberV2Preview", "enum_member_v2_preview"],
    ["errorResponseStatusCode404", "error_response_status_code404"],
    ["A2A", "a2a"],
    ["B2B", "b2b"],
    ["Protocol_A2A", "protocol_a2a"],
    ["A2A_Protocol", "a2a_protocol"],
    ["WEB_SEARCH_PREVIEW_2025_03_11", "web_search_preview_2025_03_11"],
    ["DEFAULT_2024_11_15", "default_2024_11_15"],
  ])("preserves numeric identifier boundaries in %s", (input, expected) => {
    strictEqual(camelToSnakeCase(input), expected);
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
