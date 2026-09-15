import { describe, expect, it } from "vitest";
import {
  unsafe_getPropertyOptionalityOverride as getPropertyOptionalityOverride,
  unsafe_overridePropertyOptionality as overridePropertyOptionality,
} from "../../src/experimental/index.js";
import { mutateSubgraph } from "../../src/experimental/mutators.js";
import type { DecoratorContext, Model, ModelProperty } from "../../src/index.js";
import { mockFile, t } from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";
import { Tester } from "../tester.js";

const history = new WeakMap<ModelProperty, DecoratorContext>();
const OverrideTester = Tester.files({
  "overrides.js": mockFile.js({
    $history(context: DecoratorContext, property: ModelProperty) {
      history.set(property, context);
      property.optional = false;
    },
    $optional(context: DecoratorContext, model: Model) {
      for (const property of model.properties.values()) {
        overridePropertyOptionality(property, true, context);
      }
    },
  }),
}).import("./overrides.js");

describe("explicit property optionality", () => {
  it("records same-value intent and leaves ordinary assignments unmarked", async () => {
    const { p } = await Tester.compile(t.code`model M { ${t.modelProperty("p")}?: string; }`);
    p.optional = true;
    expect(getPropertyOptionalityOverride(p)).toBeUndefined();
    overridePropertyOptionality(p, true);
    expect(getPropertyOptionalityOverride(p)?.optional).toBe(true);
  });

  it("preserves overrides through is, spreads, and decorator replay", async () => {
    const { Derived, Source } = await OverrideTester.compile(t.code`
      model ${t.model("Source")} { @history p: string; }
      @optional model Transform<T> { ...T; }
      model First is Transform<Source>;
      model Second { ...First; }
      model ${t.model("Derived")} is Second;
    `);
    const source = Source.properties.get("p")!;
    const derived = Derived.properties.get("p")!;
    expect(derived.optional).toBe(true);
    expect(getPropertyOptionalityOverride(derived)?.supersedes(history.get(derived)!)).toBe(true);
    expect(source.optional).toBe(false);
    expect(getPropertyOptionalityOverride(source)).toBeUndefined();
  });

  it("does not supersede directly authored annotations", async () => {
    const { p } = await OverrideTester.compile(t.code`
      @optional model M { @history ${t.modelProperty("p")}: string; }
    `);
    expect(getPropertyOptionalityOverride(p)?.supersedes(history.get(p)!)).toBe(false);
  });

  it("does not absorb new augments when a model decorator is replayed", async () => {
    const { Derived } = await OverrideTester.compile(t.code`
      model Source { p: string; }
      @optional model Transform { ...Source; }
      model ${t.model("Derived")} is Transform;
      @@history(Derived.p);
    `);
    const p = Derived.properties.get("p")!;
    expect(history.get(p)).toBeDefined();
    expect(getPropertyOptionalityOverride(p)?.supersedes(history.get(p)!)).toBe(false);
  });

  for (const cloneKind of ["checker", "typekit"] as const) {
    it(`copies provenance using ${cloneKind} without changing siblings`, async () => {
      const { p, program } = await OverrideTester.compile(t.code`
        model M { @history ${t.modelProperty("p")}: string; }
      `);
      const clone =
        cloneKind === "checker" ? program.checker.cloneType(p) : $(program).type.clone(p);
      overridePropertyOptionality(clone, true);
      $(program).type.finishType(clone);
      const sibling = program.checker.cloneType(p);
      const descendant = program.checker.cloneType(clone);
      expect(clone.optional).toBe(true);
      expect(descendant.optional).toBe(true);
      expect(getPropertyOptionalityOverride(descendant)?.supersedes(history.get(descendant)!)).toBe(
        true,
      );
      expect(getPropertyOptionalityOverride(p)).toBeUndefined();
      expect(getPropertyOptionalityOverride(sibling)).toBeUndefined();
      expect(p.optional).toBe(false);
      expect(sibling.optional).toBe(false);
    });
  }

  it("keeps the latest explicit override through multiple mutations and model replay", async () => {
    const { M, program } = await OverrideTester.compile(t.code`
      model Source { p: string; }
      @optional model ${t.model("M")} { ...Source; }
    `);
    const required = mutateSubgraph(
      program,
      [
        {
          name: "required",
          Model() {},
          ModelProperty(_source, clone) {
            overridePropertyOptionality(clone, false);
          },
        },
      ],
      M,
    ).type;
    if (required.kind !== "Model") throw new Error("Expected model");
    expect(required.properties.get("p")!.optional).toBe(false);
    const second = mutateSubgraph(
      program,
      [
        {
          name: "unrelated",
          Model() {},
          ModelProperty(_source, clone) {
            clone.name = "renamed";
          },
        },
      ],
      required,
    ).type;
    expect(second.kind).toBe("Model");
    if (second.kind !== "Model") throw new Error("Expected model");
    expect([...second.properties.values()][0].optional).toBe(false);
    expect(M.properties.get("p")!.optional).toBe(true);
  });

  it("preserves provenance for decorator applications without syntax nodes", async () => {
    const { M, program } = await Tester.compile(t.code`
      model ${t.model("M")} { p: string; }
    `);
    const p = M.properties.get("p")!;
    p.decorators.push({
      decorator(context: DecoratorContext, target: ModelProperty) {
        history.set(target, context);
      },
      args: [],
    });
    program.checker.finishType(p);
    const clone = program.checker.cloneType(M);
    overridePropertyOptionality(clone.properties.get("p")!, true);
    const result = mutateSubgraph(
      program,
      [
        {
          name: "replay",
          Model() {},
          ModelProperty() {},
        },
      ],
      clone,
    ).type;
    if (result.kind !== "Model") throw new Error("Expected model");
    const mutated = result.properties.get("p")!;
    expect(history.get(mutated)).toBeDefined();
    expect(getPropertyOptionalityOverride(mutated)?.supersedes(history.get(mutated)!)).toBe(true);
  });

  it("allows multiple explicit replacements within one decorator execution", async () => {
    const { p, program } = await Tester.files({
      "multiple.js": mockFile.js({
        $multiple(context: DecoratorContext, property: ModelProperty) {
          overridePropertyOptionality(property, true, context);
          overridePropertyOptionality(property, false, context);
        },
      }),
    }).import("./multiple.js").compile(t.code`
      model M { @multiple ${t.modelProperty("p")}: string; }
    `);
    expect(p.optional).toBe(false);
    expect(getPropertyOptionalityOverride(p)?.optional).toBe(false);
    const clone = program.checker.cloneType(p);
    expect(clone.optional).toBe(false);
  });
});
