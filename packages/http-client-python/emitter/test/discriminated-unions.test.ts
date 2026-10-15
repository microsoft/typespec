import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { EmitterTester, emitCodeModel } from "./test-host.js";

function petService(
  decorator = '@discriminated(#{ envelope: "none" })',
  constraint = "extends PetBase",
  inheritance = "extends PetBase",
  propertyName = "kind",
) {
  const nameProperty = inheritance ? "" : "name: string;";
  return `
    import "@typespec/http";
    using TypeSpec.Http;
    @service namespace Test;
    model PetBase { ${propertyName}: string; name: string; }
    model Cat ${inheritance} { ${propertyName}: "cat"; ${nameProperty} meows: boolean; }
    model Dog ${inheritance} { ${propertyName}: "dog"; ${nameProperty} barks: boolean; }
    ${decorator}
    #suppress "@azure-tools/typespec-azure-core/union-enums-invalid-kind" "Model union, not an enum."
    union Pet ${constraint} { cat: Cat, dog: Dog }
    model Pets { pet: Pet; pets: Pet[]; byName: Record<Pet>; }
    @post op echo(@body pet: Pet): Pet;
    @post @route("/pets") op echoPets(@body pets: Pets): Pets;
    @get @route("/cat") op getCat(): Cat;
  `;
}

describe("inline discriminated unions", () => {
  it.each(["kind", "petType"])("preserves P1 metadata for %s", async (propertyName) => {
    const { codeModel, diagnostics } = await emitCodeModel(
      petService(
        `@discriminated(#{ envelope: "none", discriminatorPropertyName: "${propertyName}" })`,
        undefined,
        undefined,
        propertyName,
      ),
      {},
    );
    expectDiagnostics(diagnostics, []);
    const pet = codeModel.types.find((type) => type.name === "Pet");
    expect(pet).toMatchObject({
      type: "combined",
      types: [{ name: "Cat" }, { name: "Dog" }],
      baseType: { name: "PetBase" },
      discriminator: {
        propertyName,
        variants: { cat: { name: "Cat" }, dog: { name: "Dog" } },
      },
    });
    for (const name of ["Cat", "Dog"]) {
      expect(codeModel.types.find((type) => type.name === name)).toMatchObject({
        parents: [{ name: "PetBase" }],
        discriminatedSubtypes: {},
      });
    }
    expect(codeModel.types.find((type) => type.name === "PetBase")).toMatchObject({
      discriminatedSubtypes: {},
    });
  });

  it("leaves ordinary constrained unions untagged", async () => {
    const { codeModel, diagnostics } = await emitCodeModel(petService(""));
    expectDiagnostics(diagnostics, []);
    expect(codeModel.types.find((type) => type.name === "Pet")).not.toHaveProperty("discriminator");
  });

  it("supports recursive variants", async () => {
    const { codeModel, diagnostics } = await emitCodeModel(
      petService().replace("meows: boolean;", "meows: boolean; friend?: Pet;"),
    );
    expectDiagnostics(diagnostics, []);
    expect(codeModel.types.find((type) => type.name === "Pet")).toHaveProperty("discriminator");
  });

  it("uses the JSON wire name for an encoded discriminator", async () => {
    const { codeModel, diagnostics } = await emitCodeModel(
      petService().replaceAll("kind:", '@encodedName("application/json", "pet-kind") kind:'),
    );
    expectDiagnostics(diagnostics, []);
    expect(codeModel.types.find((type) => type.name === "Pet")).toHaveProperty(
      "discriminator.propertyName",
      "pet-kind",
    );
  });

  it("rejects default variants instead of guessing fallback semantics", async () => {
    const diagnostics = await EmitterTester.diagnose(
      petService().replace("dog: Dog }", "dog: Dog, PetBase }"),
      {
        compilerOptions: {
          options: { "@typespec/http-client-python": { "emit-yaml-only": true } },
        },
      },
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/http-client-python/unsupported-discriminated-union",
      severity: "error",
    });
  });

  it.each([
    ['@discriminated(#{ envelope: "none" })', "", "extends PetBase"],
    ['@discriminated(#{ envelope: "none" })', "extends PetBase", ""],
    ["@discriminated", "extends PetBase", "extends PetBase"],
  ])("diagnoses unsupported semantics: %s %s %s", async (decorator, constraint, inheritance) => {
    const diagnostics = await EmitterTester.diagnose(
      petService(decorator, constraint, inheritance),
      {
        compilerOptions: {
          options: {
            "@typespec/http-client-python": { "emit-yaml-only": true },
          },
        },
      },
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/http-client-python/unsupported-discriminated-union",
      severity: "error",
    });
  });
});
