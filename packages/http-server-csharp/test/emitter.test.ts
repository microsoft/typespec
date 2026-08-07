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

  const launchSettings = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/Properties/launchSettings.json"),
  )?.[1];

  expect(launchSettings).toBeDefined();
  expect(launchSettings).toContain("https://localhost:7000;http://localhost:5000");
  expect(launchSettings).toContain("http://localhost:5000");
});

it("uses C# type names for model files and places enum docs before attributes", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      /** A camel enum. */
      enum camelEnum {
        value
      }

      model camelModel {}
    `),
  );
  const files = [...result.fs.fs.entries()];
  const enumFile = files.find(([path]) => path.endsWith("/generated/models/CamelEnum.cs"));

  expect(enumFile?.[1]).toContain(`/// <summary>
/// A camel enum.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CamelEnum`);
  expect(files.some(([path]) => path.endsWith("/generated/models/CamelModel.cs"))).toBe(true);
  expect(files.some(([path]) => path.endsWith("/generated/models/camelEnum.cs"))).toBe(false);
  expect(files.some(([path]) => path.endsWith("/generated/models/camelModel.cs"))).toBe(false);
});
