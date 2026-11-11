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
  expect(hasPathEndingWith("/generated/lib/HttpServiceException.cs")).toBe(true);

  expect(paths.some((path) => path.includes("/generated/controllers/"))).toBe(false);
  expect(paths.some((path) => path.includes("/generated/operations/"))).toBe(false);
  expect(hasPathEndingWith("/generated/lib/HttpServiceExceptionFilter.cs")).toBe(false);
  expect(hasPathEndingWith("/generated/models/ContosoOperationsCreateRequest.cs")).toBe(false);
  expect(paths.some((path) => path.includes("/mocks/"))).toBe(false);
  expect(hasPathEndingWith("/Program.cs")).toBe(false);
  expect(hasPathEndingWith("/ServiceProject.csproj")).toBe(false);
  expect(hasPathEndingWith("/Properties/launchSettings.json")).toBe(false);
  expect(hasPathEndingWith("/appsettings.json")).toBe(false);
  expect(hasPathEndingWith("/docs/emitter.md")).toBe(false);

  const httpServiceException = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/lib/HttpServiceException.cs"),
  )?.[1];
  expect(httpServiceException).not.toContain("Microsoft.AspNetCore");
  expect(httpServiceException).not.toContain("IActionFilter");
  expect(httpServiceException).not.toContain("IOrderedFilter");
});

it("emits the HTTP service exception filter for server output", async () => {
  const [result] = await compileAndDiagnose(tester, getStandardService("op read(): string;"), {
    "skip-format": true,
  });
  const paths = [...result.fs.fs.keys()];
  const hasPathEndingWith = (suffix: string) => paths.some((path) => path.endsWith(suffix));

  expect(hasPathEndingWith("/generated/lib/HttpServiceException.cs")).toBe(true);
  expect(hasPathEndingWith("/generated/lib/HttpServiceExceptionFilter.cs")).toBe(true);
});

it("uses the json encoded name as the serialized value of an enum member", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum Status {
        @encodedName("application/json", "on")
        active,
        @encodedName("application/json", "off")
        inactive: "inactive-value",
        @encodedName("application/xml", "xml-pending")
        pending,
      }

      model Item {
        status: Status;
      }

      op read(): Item;
    `),
    { "skip-format": true },
  );
  const status = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/Status.cs"),
  )?.[1];

  expect(status).toContain(`[JsonStringEnumMemberName("on")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("off")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("pending")]`);
  expect(status).not.toContain(`[JsonStringEnumMemberName("active")]`);
});

it("types a non-integer enum whose members are all encoded as the enum", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum Ratio {
        @encodedName("application/json", "half")
        Half: 0.5,
        @encodedName("application/json", "quarter")
        Quarter: 0.25,
      }

      model Item {
        ratio: Ratio;
      }

      op read(): Item;
    `),
    { "skip-format": true },
  );
  const files = [...result.fs.fs.entries()];
  const item = files.find(([path]) => path.endsWith("/generated/models/Item.cs"))?.[1];
  const ratio = files.find(([path]) => path.endsWith("/generated/models/Ratio.cs"))?.[1];

  expect(item).toContain("public Ratio Ratio { get; set; }");
  expect(ratio).toContain(`[JsonStringEnumMemberName("half")]`);
  expect(ratio).toContain(`[JsonStringEnumMemberName("quarter")]`);
});

it("emits members from nested provisioning-state unions", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      union ResourceProvisioningState {
        Succeeded: "Succeeded",
        Failed: "Failed",
        Cancelled: "Cancelled",
      }

      union ProvisioningState {
        Accepted: "Accepted",
        Creating: "Creating",
        ResourceProvisioningState,
        string,
      }

      model Resource {
        provisioningState: ProvisioningState;
      }

      op read(): Resource;
    `),
    { "skip-format": true },
  );
  const provisioningState = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/ProvisioningState.cs"),
  )?.[1];

  expect(provisioningState).toContain("public enum ProvisioningState");
  expect(provisioningState).toContain(`[JsonStringEnumMemberName("Succeeded")]`);
  expect(provisioningState).toContain("Succeeded,");
  expect(provisioningState).toContain(`[JsonStringEnumMemberName("Failed")]`);
  expect(provisioningState).toContain("Failed,");
  expect(provisioningState).toContain(`[JsonStringEnumMemberName("Cancelled")]`);
  expect(provisioningState).toMatch(/Cancelled,?\r?\n}/);
});

it("emits shared nested-union members once in diamond-shaped union graphs", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      union SharedStates {
        Shared: "shared",
      }

      union LeftStates {
        Left: "left",
        SharedStates,
      }

      union RightStates {
        Right: "right",
        SharedStates,
      }

      union DiamondState {
        LeftStates,
        RightStates,
        string,
      }

      model Resource {
        state: DiamondState;
      }

      op read(): Resource;
    `),
    { "skip-format": true },
  );
  const diamondState = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/DiamondState.cs"),
  )?.[1];

  expect(diamondState).toContain("public enum DiamondState");
  expect(diamondState).toContain(`[JsonStringEnumMemberName("left")]`);
  expect(diamondState).toContain(`[JsonStringEnumMemberName("right")]`);
  expect(diamondState).toContain(`[JsonStringEnumMemberName("shared")]`);
  expect(diamondState?.match(/JsonStringEnumMemberName\("shared"\)/g)).toHaveLength(1);
});

it("terminates safely for recursive string unions without emitting enums", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      union Recursive {
        "ready",
        Recursive,
      }

      union First {
        "first",
        Second,
      }

      union Second {
        "second",
        First,
      }

      model Resource {
        recursive: Recursive;
        first: First;
      }

      op read(): Resource;
    `),
    { "skip-format": true },
  );
  const paths = [...result.fs.fs.keys()];

  expect(paths.some((path) => path.endsWith("/generated/models/Recursive.cs"))).toBe(false);
  expect(paths.some((path) => path.endsWith("/generated/models/First.cs"))).toBe(false);
  expect(paths.some((path) => path.endsWith("/generated/models/Second.cs"))).toBe(false);
});
