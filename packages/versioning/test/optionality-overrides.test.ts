import type { DecoratorContext, Model, Namespace } from "@typespec/compiler";
import {
  unsafe_getPropertyOptionalityOverride as getPropertyOptionalityOverride,
  unsafe_overridePropertyOptionality as overridePropertyOptionality,
  unsafe_mutateSubgraphWithNamespace,
} from "@typespec/compiler/experimental";
import { expectDiagnostics, mockFile } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getMadeOptionalOn, getMadeRequiredOn } from "../src/decorators.js";
import { getVersioningMutators } from "../src/mutator.js";
import { Tester } from "./test-host.js";

const VersionedTester = Tester.wrap(
  (code) => `
    @versioned(Versions)
    namespace Service {
      enum Versions { v1, v2, v3 }
      ${code}
    }
  `,
);

const CustomTester = VersionedTester.files({
  "custom.js": mockFile.js({
    $relaxed(context: DecoratorContext, model: Model) {
      for (const property of model.properties.values()) {
        overridePropertyOptionality(property, true, context);
      }
    },
    $strict(context: DecoratorContext, model: Model) {
      for (const property of model.properties.values()) {
        overridePropertyOptionality(property, false, context);
      }
    },
  }),
}).import("./custom.js");

async function snapshots(code: string, tester = VersionedTester) {
  const { program } = await tester.compile(code);
  const service = program.getGlobalNamespaceType().namespaces.get("Service")!;
  const versioning = getVersioningMutators(program, service);
  if (versioning?.kind !== "versioned") throw new Error("Expected versioned service");
  return {
    program,
    service,
    versions: versioning.snapshots.map(({ mutator }) => {
      const { type } = unsafe_mutateSubgraphWithNamespace(program, [mutator], service);
      if (type.kind !== "Namespace") throw new Error("Expected namespace");
      return type;
    }),
  };
}

function property(namespace: Namespace, model: string, name = "foo") {
  return namespace.models.get(model)!.properties.get(name)!;
}

describe("structural optionality overrides", () => {
  for (const source of [
    "@madeRequired(Versions.v2) foo: string;",
    "@madeOptional(Versions.v2) foo?: string;",
  ]) {
    for (const declaration of [
      "model Derived is OptionalProperties<Source>;",
      "model Derived { ...OptionalProperties<Source>; }",
      `model First is OptionalProperties<Source>;
       model Second { ...First; }
       model Third is Second;
       model Derived { ...Third; }`,
    ]) {
      it(`${source} through ${declaration}`, async () => {
        const { versions, service, program } = await snapshots(`
          model Source { ${source} }
          model Transparent { ...Source; }
          ${declaration}
        `);
        for (const version of versions) {
          expect(property(version, "Derived").optional).toBe(true);
        }
        const expected = source.includes("madeRequired")
          ? [true, false, false]
          : [false, true, true];
        expect(versions.map((v) => property(v, "Source").optional)).toEqual(expected);
        expect(versions.map((v) => property(v, "Transparent").optional)).toEqual(expected);
        expect(property(service, "Source").optional).toBe(expected[2]);
        expect(getPropertyOptionalityOverride(property(service, "Source"))).toBeUndefined();
        for (const version of versions) {
          expect(getPropertyOptionalityOverride(property(version, "Source"))).toBeUndefined();
        }
        expect(getMadeRequiredOn(program, property(service, "Derived"))).toBeUndefined();
        expect(getMadeOptionalOn(program, property(service, "Derived"))).toBeUndefined();
      });
    }
  }

  it("preserves presence, rename, and type history", async () => {
    const { versions } = await snapshots(`
      model Source {
        @added(Versions.v2) @madeRequired(Versions.v3) later: string;
        @renamedFrom(Versions.v2, "oldFoo")
        @typeChangedFrom(Versions.v2, int32)
        @madeOptional(Versions.v2) foo?: string;
      }
      model Derived { ...OptionalProperties<Source>; }
    `);
    expect(versions[0].models.get("Derived")!.properties.has("later")).toBe(false);
    for (const version of versions.slice(1)) {
      expect(property(version, "Derived", "later").optional).toBe(true);
    }
    const oldFoo = property(versions[0], "Derived", "oldFoo");
    expect(oldFoo.optional).toBe(true);
    expect(oldFoo.type).toMatchObject({ kind: "Scalar", name: "int32" });
    expect(property(versions[1], "Derived").type).toMatchObject({ kind: "Scalar", name: "string" });
  });

  it("still diagnoses invalid directly authored history", async () => {
    const diagnostics = await VersionedTester.diagnose(`
      @withOptionalProperties
      model Invalid { @madeRequired(Versions.v2) foo: string; }
    `);
    expectDiagnostics(diagnostics, { code: "@typespec/versioning/made-required-optional" });
  });

  it.each([
    "@withOptionalProperties model Partial { ...Source; } model Derived { ...Partial; }",
    "@withOptionalProperties model Derived { ...Source; }",
  ])("still diagnoses a new augment on a transformed copy: %s", async (declaration) => {
    const diagnostics = await VersionedTester.diagnose(`
      model Source { @madeRequired(Versions.v2) foo: string; }
      ${declaration}
      @@madeRequired(Derived.foo, Versions.v3);
    `);
    expectDiagnostics(diagnostics, { code: "@typespec/versioning/made-required-optional" });
  });

  for (const helper of ["relaxed", "strict"]) {
    for (const source of [
      "@madeRequired(Versions.v2) foo: string;",
      "@madeOptional(Versions.v2) foo?: string;",
    ]) {
      for (const declaration of [
        "model Derived is Reshape<Source>;",
        "model Derived { ...Reshape<Source>; }",
      ]) {
        it(`custom ${helper} overrides ${source} via ${declaration}`, async () => {
          const { versions } = await snapshots(
            `
            model Source { ${source} }
            @${helper} model Reshape<T> { ...T; }
            ${declaration}
          `,
            CustomTester,
          );
          expect(versions.map((v) => property(v, "Derived").optional)).toEqual([
            helper === "relaxed",
            helper === "relaxed",
            helper === "relaxed",
          ]);
        });
      }
    }
  }

  it("keeps newly authored optionality history on the derived copy", async () => {
    const { versions, service, program } = await snapshots(
      `
      model Source { @madeRequired(Versions.v2) foo: string; }
      @relaxed model Derived { ...Source; }
      @@madeOptional(Derived.foo, Versions.v3);
      model Sibling { ...Source; }
    `,
      CustomTester,
    );
    expect(versions.map((v) => property(v, "Derived").optional)).toEqual([false, false, true]);
    expect(versions.map((v) => property(v, "Sibling").optional)).toEqual([true, false, false]);
    expect(getMadeOptionalOn(program, property(service, "Derived"))?.name).toBe("v3");
    expect(getMadeRequiredOn(program, property(service, "Derived"))).toBeUndefined();
  });

  it("still diagnoses newly authored madeOptional on a required transformed copy", async () => {
    const diagnostics = await CustomTester.diagnose(`
      model Source { @madeOptional(Versions.v2) foo?: string; }
      @strict model Derived { ...Source; }
      @@madeOptional(Derived.foo, Versions.v3);
    `);
    expectDiagnostics(diagnostics, { code: "@typespec/versioning/made-optional-not-optional" });
  });

  it("keeps newly authored required history on a required transformed copy", async () => {
    const { versions } = await snapshots(
      `
      model Source { @madeOptional(Versions.v2) foo?: string; }
      @strict model Derived { ...Source; }
      @@madeRequired(Derived.foo, Versions.v3);
    `,
      CustomTester,
    );
    expect(versions.map((v) => property(v, "Derived").optional)).toEqual([true, true, false]);
  });

  it("lets the last explicit transform replace an earlier override", async () => {
    const { versions } = await snapshots(
      `
      model Source { @madeOptional(Versions.v2) foo?: string; }
      @strict model Strict<T> { ...T; }
      @relaxed model Relaxed<T> { ...T; }
      model Derived { ...Strict<OptionalProperties<Source>>; }
      model OptionalAgain is Relaxed<Strict<Source>>;
    `,
      CustomTester,
    );
    expect(versions.map((v) => property(v, "Derived").optional)).toEqual([false, false, false]);
    expect(versions.map((v) => property(v, "OptionalAgain").optional)).toEqual([true, true, true]);
  });

  it("does not hide an invalid annotation on the source", async () => {
    const diagnostics = await VersionedTester.diagnose(`
      model Source { @madeRequired(Versions.v2) foo?: string; }
      model Derived { ...OptionalProperties<Source>; }
    `);
    expectDiagnostics(diagnostics, { code: "@typespec/versioning/made-required-optional" });
  });
});
