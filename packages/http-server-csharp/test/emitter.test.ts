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

it("emits only models and their support files when output-type is models", async () => {
  const service = getStandardService(`
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
  `);
  const [result] = await compileAndDiagnose(
    tester,
    service,
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
  expect(hasPathEndingWith("/docs/emitter.md")).toBe(false);

  const [allResult] = await compileAndDiagnose(tester, service, {
    "output-type": "all",
    "skip-format": true,
  });
  const allPaths = [...allResult.fs.fs.keys()];

  expect(
    allPaths.some((path) => path.endsWith("/generated/models/ContosoOperationsCreateRequest.cs")),
  ).toBe(true);
  expect(allPaths.some((path) => path.includes("/generated/controllers/"))).toBe(true);
  expect(allPaths.some((path) => path.includes("/generated/operations/"))).toBe(true);
  expect(allPaths.some((path) => path.endsWith("/Program.cs"))).toBe(true);
  expect(allPaths.some((path) => path.endsWith("/docs/emitter.md"))).toBe(true);
});
