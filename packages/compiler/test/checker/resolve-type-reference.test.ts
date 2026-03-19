import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: resolveTypeReference", () => {
  async function expectResolve(reference: string, code: string) {
    const { target, program } = (await Tester.compile(code)) as any;
    if (target === undefined) {
      throw new Error(`Must have a /*target*/ marker on type that should be referenced`);
    }
    const [resolved, diagnostics] = program.resolveTypeReference(reference);
    expectDiagnosticEmpty(diagnostics);
    ok(resolved === target, `Expected to resolve ${reference} to same type as target`);
  }

  async function diagnoseResolution(reference: string, code: string) {
    const { program } = await Tester.compile(code);
    const [resolved, diagnostics] = program.resolveTypeReference(reference);
    strictEqual(resolved, undefined);
    return diagnostics;
  }

  it("resolve simple namespace", () =>
    expectResolve("MyService", `namespace /*target*/MyService {}`));

  it("resolve a deprecated type", async () => {
    const { target, program } = (await Tester.compile(`
      #deprecated "Test deprecated item"
      model /*target*/MyModel {}
    `)) as any;
    const [resolved, diagnostics] = program.resolveTypeReference("MyModel");
    expectDiagnostics(diagnostics, { severity: "warning", code: "deprecated" });
    strictEqual(resolved, target);
  });

  it("resolve nested namespace", () =>
    expectResolve("MyOrg.MyService", `namespace MyOrg./*target*/MyService {}`));

  it("resolve model at root", () => expectResolve("Pet", `model /*target*/Pet {}`));

  it("resolve model in namespace", () =>
    expectResolve("MyOrg.MyService.Pet", `namespace MyOrg.MyService; model /*target*/Pet {}`));

  it("resolve model property", () =>
    expectResolve("Pet.name", `model Pet { /*target*/name: string }`));

  it("resolve model property from base class", () =>
    expectResolve(
      "Pet.name",
      `model Animal { /*target*/name: string } model Pet extends Animal { }`,
    ));

  it("resolve metatype", () =>
    expectResolve("Pet.home::type.street", `model Pet { home: { /*target*/street: string } }`));

  it("doesn't instantiate template", async () => {
    const diagnostics = await diagnoseResolution("Foo<{}>", `model Foo<T> {t: T}`);
    expectDiagnostics(diagnostics, []);
  });

  it("resolve enum member", () => expectResolve("Direction.up", `enum Direction { /*target*/up }`));

  it("resolve enum member with spread", async () => {
    const { Direction, program } = (await Tester.compile(`
      enum Foo { up }
      enum /*Direction*/Direction { ... Foo }
    `)) as any;
    const [resolved, diagnostics] = program.resolveTypeReference("Direction.up");
    expectDiagnosticEmpty(diagnostics);
    const directionUp = Direction.members.get("up");
    ok(directionUp, "Direction should have member 'up'");
    ok(resolved === directionUp);
  });

  it("resolve via alias", () =>
    expectResolve("PetName", `model Pet { /*target*/name: string } alias PetName = Pet.name;`));

  it("emit diagnostic if not found", async () => {
    const diagnostics = await diagnoseResolution("Direction.up", ``);
    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier Direction",
    });
  });

  it("emit diagnostic if invalid type reference", async () => {
    const diagnostics = await diagnoseResolution("model Bar {}", ``);
    expectDiagnostics(diagnostics, {
      code: "reserved-identifier",
      message: "Keyword cannot be used as identifier.",
    });
  });
});
