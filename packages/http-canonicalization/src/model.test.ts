import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import type { HttpCanonicalization } from "./http-canonicalization-classes.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import type { ModelHttpCanonicalization } from "./model.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("applies friendly name", async () => {
  const { Foo, program } = await runner.compile(t.code`
    @friendlyName("Bar")
    model ${t.model("Foo")} {
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const canonicalized = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  expect(canonicalized.languageType.name).toBe("Bar");
  expect(canonicalized.wireType.name).toBe("Bar");
});

it("works for polymorphic models", async () => {
  const { Animal, Test, program } = await runner.compile(t.code`
    @discriminator("kind")
    model ${t.model("Animal")} {
      kind: string;
    }

    model Dog extends Animal {
      kind: "Dog";
    }

    model Cat extends Animal {
      kind: "Cat";
    }

    model ${t.model("Test")} {
      prop: Animal;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const canonicalized = canonicalizer.canonicalize(Animal, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  expect(canonicalized.isPolymorphicModel).toBe(true);

  const union = canonicalized.polymorphicModelUnion!;
  expect(union.variants.size).toBe(2);
  const info = tk.union.getDiscriminatedUnion(union.languageType);
  expect(info!.options).toEqual({
    envelope: "none",
    discriminatorPropertyName: "kind",
    envelopePropertyName: "value",
  });
  expect(canonicalized.languageMutationNode.kind === "Model").toBe(true);

  // verify that the Test model's prop property points to the union
  const testCanonicalized = canonicalizer.canonicalize(Test, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });
  const propType = testCanonicalized.properties.get("prop")!.type as HttpCanonicalization;
  expect(propType.kind === "Union").toBe(true);
});

it("works for polymorphic models that are referenced in arrays", async () => {
  const { Test, program } = await runner.compile(t.code`
    @discriminator("kind")
    model ${t.model("Animal")} {
      kind: string;
    }

    model Dog extends Animal {
      kind: "Dog";
    }

    model Cat extends Animal {
      kind: "Cat";
    }

    model ${t.model("Test")} {
      prop: Animal[];
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  // verify that the Test model's prop property points to the union
  const testCanonicalized = canonicalizer.canonicalize(Test, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });
  const propType = testCanonicalized.properties.get("prop")!.type as ModelHttpCanonicalization;
  expect(propType.kind).toBe("Model");
  const indexerType = propType.indexer?.value as HttpCanonicalization;
  expect(indexerType.kind).toBe("Union");
});

it("uses effective models", async () => {
  const { Animal, Test, program } = await runner.compile(t.code`
    model ${t.model("Animal")} {
      kind: string;
    }

    model ${t.model("Test")} {
      prop: { ... Animal };
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  // verify that the Test model's prop property points to the union
  const testCanonicalized = canonicalizer.canonicalize(Test, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });
  const animalCanonicalized = canonicalizer.canonicalize(Animal, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });
  const propType = testCanonicalized.properties.get("prop")!.type as ModelHttpCanonicalization;
  expect(propType === animalCanonicalized).toBe(true);
});
