import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { camelToSnakeCase, md2Rst } from "../src/utils.js";

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

  it("md2rst", async () => {
    const des = "Format: <MajorVersion>.<MinorVersion>.<Patch>";
    strictEqual(md2Rst(des), "Format: <MajorVersion>.<MinorVersion>.<Patch>");
  });
});
