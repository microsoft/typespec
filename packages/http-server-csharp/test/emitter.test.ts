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

it("uses C# type names for generated type files", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum camelEnum {
        value
      }

      model camelModel {}

      @route("/items")
      interface camelInterface {
        @post op create(item: string): void;
      }
    `),
    { "emit-mocks": "mocks-and-project-files", "skip-format": true },
  );
  const files = [...result.fs.fs.keys()];

  expect(files.some((path) => path.endsWith("/generated/models/CamelEnum.cs"))).toBe(true);
  expect(files.some((path) => path.endsWith("/generated/models/CamelModel.cs"))).toBe(true);
  expect(
    files.some((path) => path.endsWith("/generated/models/CamelInterfaceCreateRequest.cs")),
  ).toBe(true);
  expect(files.some((path) => path.endsWith("/generated/operations/ICamelInterface.cs"))).toBe(
    true,
  );
  expect(
    files.some((path) => path.endsWith("/generated/controllers/CamelInterfaceController.cs")),
  ).toBe(true);
  expect(files.some((path) => path.endsWith("/mocks/CamelInterface.cs"))).toBe(true);
  expect(files.some((path) => path.includes("/generated/models/camel"))).toBe(false);
  expect(files.some((path) => path.includes("/generated/operations/Icamel"))).toBe(false);
  expect(files.some((path) => path.includes("/generated/controllers/camel"))).toBe(false);
});
