import { resolveVirtualPath } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { ApiTester, compileAndDiagnose, getStandardService } from "./test-host.js";

let tester: Awaited<ReturnType<typeof ApiTester.createInstance>>;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

it("uses deterministic default ports for project files", async () => {
  const [result] = await compileAndDiagnose(tester, getStandardService("op read(): string;"), {
    "emit-mocks": "mocks-and-project-files",
    "skip-format": true,
  });

  const launchSettings = result.fs.get(
    resolveVirtualPath(
      "@typespec",
      "http-server-csharp",
      "ServiceProject",
      "Properties",
      "launchSettings.json",
    ),
  );

  expect(launchSettings).toContain("https://localhost:7000;http://localhost:5000");
  expect(launchSettings).toContain("http://localhost:5000");
});
