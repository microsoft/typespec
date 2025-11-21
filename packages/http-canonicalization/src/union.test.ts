import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, describe, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import type { UnionHttpCanonicalization } from "./union.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

describe("UnionCanonicalization variant detection", () => {
  it("detects literal property discriminants for object unions", async () => {
    const { Choice, First, Second, program } = await runner.compile(t.code`
      model ${t.model("First")} { kind: "first"; }
      model ${t.model("Second")} { kind: "second"; }
      union ${t.union("Choice")} { First, Second }
    `);

    const canonicalizer = new HttpCanonicalizer($(program));
    const canonical = canonicalizer.canonicalize(Choice, {
      visibility: Visibility.All,
    }) as UnionHttpCanonicalization;

    expect(canonical.languageVariantTests.length).toBe(2);

    const [firstVariant, secondVariant] = canonical.languageVariantTests;

    expect(firstVariant.variant.sourceType.type).toBe(First);
    expect(firstVariant.tests).toEqual([{ kind: "literal", path: ["kind"], value: "first" }]);

    expect(secondVariant.variant.sourceType.type).toBe(Second);
    expect(secondVariant.tests).toEqual([{ kind: "literal", path: ["kind"], value: "second" }]);

    expect(canonical.wireVariantTests).toEqual(canonical.languageVariantTests);
  });

  it("prioritizes primitives before object variants and prepends type guards", async () => {
    const { Choice, First, Second, program } = await runner.compile(t.code`
      model ${t.model("First")} { kind: "first"; }
      model ${t.model("Second")} { kind: "second"; }
      union ${t.union("Choice")} { First; Second; int32; }
    `);

    const canonicalizer = new HttpCanonicalizer($(program));
    const canonical = canonicalizer.canonicalize(Choice, {
      visibility: Visibility.All,
    }) as UnionHttpCanonicalization;

    expect(canonical.languageVariantTests.length).toBe(3);

    const [numberVariant, firstVariant, secondVariant] = canonical.languageVariantTests;

    expect(numberVariant.variant.sourceType.type.kind).toBe("Scalar");
    expect(numberVariant.tests).toEqual([{ kind: "type", path: [], type: "number" }]);

    expect(firstVariant.variant.sourceType.type).toBe(First);
    expect(firstVariant.tests).toEqual([
      { kind: "type", path: [], type: "object" },
      { kind: "literal", path: ["kind"], value: "first" },
    ]);

    expect(secondVariant.variant.sourceType.type).toBe(Second);
    expect(secondVariant.tests).toEqual([
      { kind: "type", path: [], type: "object" },
      { kind: "literal", path: ["kind"], value: "second" },
    ]);

    expect(canonical.wireVariantTests.map((entry) => entry.variant)).toEqual(
      canonical.languageVariantTests.map((entry) => entry.variant),
    );
    expect(canonical.wireVariantTests.map((entry) => entry.tests)).toEqual(
      canonical.languageVariantTests.map((entry) => entry.tests),
    );
  });

  it("distinguishes primitive scalar variants", async () => {
    const { Choice, program } = await runner.compile(t.code`
      union ${t.union("Choice")} { string; boolean; int32; }
    `);

    const canonicalizer = new HttpCanonicalizer($(program));
    const canonical = canonicalizer.canonicalize(Choice, {
      visibility: Visibility.All,
    }) as UnionHttpCanonicalization;

    expect(canonical.languageVariantTests).toHaveLength(3);
    expect(canonical.languageVariantTests.map((entry) => entry.tests)).toEqual([
      [{ kind: "type", path: [], type: "number" }],
      [{ kind: "type", path: [], type: "boolean" }],
      [{ kind: "type", path: [], type: "string" }],
    ]);

    expect(canonical.wireVariantTests.map((entry) => entry.tests)).toEqual(
      canonical.languageVariantTests.map((entry) => entry.tests),
    );
  });

  it("throws when variants cannot be distinguished", async () => {
    await expect(async () => {
      const { Choice, program } = await runner.compile(t.code`
        model ${t.model("A")} { value: string; }
        model ${t.model("B")} { value: string; }
        union ${t.union("Choice")} { A, B }
      `);

      const canonicalizer = new HttpCanonicalizer($(program));
      canonicalizer.canonicalize(Choice, {
        visibility: Visibility.All,
      });
    }).rejects.toThrow(/Unable to distinguish union variant/);
  });
});
