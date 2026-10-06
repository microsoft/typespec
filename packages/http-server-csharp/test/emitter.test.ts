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

it("uses the json encoded name as the serialized value of an enum member without a value", async () => {
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

it("writes one JsonPropertyName for a property, carrying its encoded name", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      model Item {
        @encodedName("application/json", "full_name")
        fullName: string;
        nickName: string;
      }

      op read(): Item;
    `),
    { "skip-format": true },
  );
  const item = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/Item.cs"),
  )?.[1];

  expect(item?.match(/JsonPropertyName/g)).toHaveLength(2);
  expect(item).toContain(`[JsonPropertyName("full_name")]`);
  expect(item).toContain(`[JsonPropertyName("nickName")]`);
});

it("uses the encoded name for a property of an anonymous request body", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      @post op create(
        @encodedName("application/json", "full_name") fullName: string,
        nickName: string,
      ): void;
    `),
    { "skip-format": true },
  );
  const request = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/ContosoOperationsCreateRequest.cs"),
  )?.[1];

  expect(request?.match(/JsonPropertyName/g)).toHaveLength(2);
  expect(request).toContain(`[JsonPropertyName("full_name")]`);
  expect(request).toContain(`[JsonPropertyName("nickName")]`);
});

it("escapes an encoded property name", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      model Item {
        @encodedName("application/json", "a\\"b\\\\c${"\u2028"}d")
        name: string;
      }

      op read(): Item;
    `),
    { "skip-format": true },
  );
  const item = [...result.fs.fs.entries()].find(([path]) =>
    path.endsWith("/generated/models/Item.cs"),
  )?.[1];

  expect(item).toContain(`[JsonPropertyName("a\\"b\\\\c\\u2028d")]`);
});

it("escapes an encoded name used as the serialized value of an enum member", async () => {
  const [result] = await compileAndDiagnose(
    tester,
    getStandardService(`
      enum Status {
        @encodedName("application/json", "a\\"b")
        quoted,
        @encodedName("application/json", "c\\\\d")
        backslashed,
        @encodedName("application/json", "e${"\u2028"}f${"\u2029"}g${"\u0085"}h")
        lineSeparators,
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

  expect(status).toContain(`[JsonStringEnumMemberName("a\\"b")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("c\\\\d")]`);
  expect(status).toContain(`[JsonStringEnumMemberName("e\\u2028f\\u2029g\\u0085h")]`);
});
