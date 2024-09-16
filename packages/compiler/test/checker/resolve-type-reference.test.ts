import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: resolveTypeReference", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost());
  });

  async function expectResolve(reference: string, code: string) {
    const { target } = await runner.compile(code);
    if (target === undefined) {
      throw new Error(`Must have @test("target") on type that should be referenced`);
    }
    const [resolved, diagnostics] = runner.program.resolveTypeReference(reference);
    expectDiagnosticEmpty(diagnostics);
    strictEqual(resolved, target);
  }

  async function diagnoseResolution(reference: string, code: string) {
    await runner.compile(code);
    const [resolved, diagnostics] = runner.program.resolveTypeReference(reference);
    strictEqual(resolved, undefined);
    return diagnostics;
  }

  it("resolve simple namespace", async () => {
    await expectResolve(
      "MyService",
      `
      @test("target") namespace MyService {}
    `,
    );
  });

  it("resolve a deprecated type", async () => {
    const { target } = await runner.compile(`
    #deprecated "Test deprecated item"
    @test("target") 
    model MyModel {}
  `);
    if (target === undefined) {
      throw new Error(`Must have @test("target") on type that should be referenced`);
    }
    const [resolved, diagnostics] = runner.program.resolveTypeReference("MyModel");
    expectDiagnostics(diagnostics, { severity: "warning", code: "deprecated" });
    strictEqual(resolved, target);
  });

  it("resolve nested namespace", async () => {
    await expectResolve(
      "MyOrg.MyService",
      `
      @test("target") namespace MyOrg.MyService {}
    `,
    );
  });

  it("resolve model at root", async () => {
    await expectResolve(
      "Pet",
      `
      @test("target") model Pet {}
    `,
    );
  });

  it("resolve model in namespace", async () => {
    await expectResolve(
      "MyOrg.MyService.Pet",
      `
      namespace MyOrg.MyService;
      @test("target") model Pet {}
    `,
    );
  });

  it("resolve model property", async () => {
    await expectResolve(
      "Pet.name",
      `
      model Pet { @test("target") name: string}
    `,
    );
  });

  it("resolve metatype", async () => {
    await expectResolve(
      "Pet.home::type.street",
      `
      model Pet { home: { @test("target") street: string}}
    `,
    );
  });

  it("doesn't instantiate template", async () => {
    const diagnostics = await diagnoseResolution("Foo<{}>", "model Foo<T> {t: T}");
    expectDiagnostics(diagnostics, []);
  });

  it("resolve enum member", async () => {
    await expectResolve(
      "Direction.up",
      `
      enum Direction { @test("target") up}
    `,
    );
  });

  it("resolve via alias", async () => {
    await expectResolve(
      "PetName",
      `
      model Pet { @test("target") name: string}

      alias PetName = Pet.name;
    `,
    );
  });

  it("emit diagnostic if not found", async () => {
    const diagnostics = await diagnoseResolution("Direction.up", "");
    expectDiagnostics(diagnostics, {
      code: "unknown-identifier",
      message: "Unknown identifier Direction",
    });
  });

  it("emit diagnostic if invalid type reference", async () => {
    const diagnostics = await diagnoseResolution("model Bar {}", "");
    expectDiagnostics(diagnostics, {
      code: "reserved-identifier",
      message: "Keyword cannot be used as identifier.",
    });
  });
});
