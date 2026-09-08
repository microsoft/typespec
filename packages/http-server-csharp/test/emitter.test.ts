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
  // cspell:ignore Icamel
  expect(files.some((path) => path.includes("/generated/operations/Icamel"))).toBe(false);
  expect(files.some((path) => path.includes("/generated/controllers/camel"))).toBe(false);
});

it("emits only models and support files when output-type is models", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum PetKind {
        dog,
      }

      model Pet {
        name: string;
        kind: PetKind;
      }

      @route("/pets")
      @post
      op create(name: string): Pet;
    `),
    {
      "emit-mocks": "mocks-and-project-files",
      "output-type": "models",
      "skip-format": true,
      "use-swaggerui": true,
    },
  );
  const paths = [...result.fs.fs.keys()];
  const hasPathEndingWith = (suffix: string) => paths.some((path) => path.endsWith(suffix));

  expect(hasPathEndingWith("/generated/models/Pet.cs")).toBe(true);
  expect(hasPathEndingWith("/generated/models/PetKind.cs")).toBe(true);
  expect(hasPathEndingWith("/generated/lib/JsonSerializationProvider.cs")).toBe(true);

  expect(paths.some((path) => path.includes("/generated/controllers/"))).toBe(false);
  expect(paths.some((path) => path.includes("/generated/operations/"))).toBe(false);
  expect(hasPathEndingWith("/generated/models/ContosoOperationsCreateRequest.cs")).toBe(false);
  expect(paths.some((path) => path.includes("/mocks/"))).toBe(false);
  expect(hasPathEndingWith("/Program.cs")).toBe(false);
  expect(hasPathEndingWith("/ServiceProject.csproj")).toBe(false);
  expect(hasPathEndingWith("/Properties/launchSettings.json")).toBe(false);
  expect(hasPathEndingWith("/appsettings.json")).toBe(false);
  expect(hasPathEndingWith("/docs/emitter.md")).toBe(false);
});
