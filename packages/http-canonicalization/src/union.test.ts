import type { Model } from "@typespec/compiler";
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

it("works with discriminated unions without envelope", async () => {
  const { Choice, program } = await runner.compile(t.code`
    model ${t.model("First")} { kind: "first"; }
    model ${t.model("Second")} { kind: "second"; }

    @discriminated(#{ envelope: "none", discriminatorPropertyName: "kind" })
    union ${t.union("Choice")} {
      first: First;
      second: Second;
    }
  `);

  const canonicalizer = new HttpCanonicalizer($(program));
  const canonical = canonicalizer.canonicalize(Choice, {
    visibility: Visibility.All,
  }) as UnionHttpCanonicalization;

  expect(canonical.languageVariantTests.length).toBe(0);
  expect(canonical.variantDescriptors.length).toBe(2);

  const [firstVariant, secondVariant] = canonical.variantDescriptors;

  expect(firstVariant.variant.sourceType.type).toBeDefined();
  expect((firstVariant.variant.sourceType.type as Model).name).toBe("First");
  expect(firstVariant.envelopeType).toBe(null);
  expect(firstVariant.discriminatorValue).toBe("first");

  expect(secondVariant.variant.sourceType.type).toBeDefined();
  expect((secondVariant.variant.sourceType.type as Model).name).toBe("Second");
  expect(secondVariant.envelopeType).toBe(null);
  expect(secondVariant.discriminatorValue).toBe("second");
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

  it("orders and takes into account previous tests", async () => {
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
    const [firstVariant, secondVariant, numberVariant] = canonical.languageVariantTests;
    expect(numberVariant.variant.sourceType.type.kind).toBe("Scalar");
    expect(numberVariant.tests).toEqual([{ kind: "type", path: [], type: "number" }]);

    expect(firstVariant.variant.sourceType.type).toBe(First);
    expect(firstVariant.tests).toEqual([
      { kind: "type", path: [], type: "object" },
      { kind: "literal", path: ["kind"], value: "first" },
    ]);

    expect(secondVariant.variant.sourceType.type).toBe(Second);
    expect(secondVariant.tests).toEqual([{ kind: "type", path: [], type: "object" }]);

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
    }).rejects.toThrow(/Unable to distinguish language type/);
  });

  it("supports extensible union pattern", async () => {
    const { Choice, program } = await runner.compile(t.code`
      union ${t.union("Choice")} {
        string;
        "first";
        "second";
      }
    `);

    const canonicalizer = new HttpCanonicalizer($(program));
    const canonical = canonicalizer.canonicalize(Choice, {
      visibility: Visibility.All,
    });

    expect(canonical.languageVariantTests).toHaveLength(3);
    expect(canonical.languageVariantTests.map((entry) => entry.tests)).toEqual([
      [{ kind: "literal", path: [], value: "first" }],
      [{ kind: "literal", path: [], value: "second" }],
      [{ kind: "type", path: [], type: "string" }],
    ]);
  });
});
