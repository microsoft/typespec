import { expectTypeEquals, t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { SCCSet } from "@typespec/emitter-framework";
import { Visibility } from "@typespec/http";
import { expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import type { HttpCanonicalization } from "./http-canonicalization-classes.js";
import {
  HttpCanonicalizer,
  httpCanonicalizationDependencyConnector,
} from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import type { ModelHttpCanonicalization } from "./model.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";
import type { UnionHttpCanonicalization } from "./union.js";

it("canonicalizes models for read visibility", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read)
      @encode(DateTimeKnownEncoding.rfc7231)
      createdAt: utcDateTime;

      @visibility(Lifecycle.Create)
      name: string;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);

  const read = canonicalizer.canonicalize(
    Foo,
    new HttpCanonicalizationOptions({
      visibility: Visibility.Read,
      contentType: "application/json",
    }),
  );
  expect(read.sourceType).toBe(Foo);

  // validate mutation node
  expect(read.properties.size).toBe(2);
  const deletedProperty = read.properties.get("name")! as ModelPropertyHttpCanonicalization;
  expectTypeEquals(deletedProperty.languageType as any, tk.intrinsic.never);

  // validate language type
  expect(read.languageType.name).toBe("Foo");
  expect(read.languageType.properties.size).toBe(1);
  expect(
    read.languageType.properties.get("createdAt")!.type === tk.builtin.utcDateTime,
  ).toBeTruthy();

  // validate wire type
  expect(read.wireType.name).toBe("Foo");
  expect(read.wireType.properties.size).toBe(1);
  expect(read.wireType.properties.get("createdAt")!.type === tk.builtin.string).toBeTruthy();
});

it("canonicalizes models for write visibility", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read)
      createdAt: utcDateTime;

      @visibility(Lifecycle.Create)
      name: string;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const write = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Create,
  }) as ModelHttpCanonicalization;

  expect(write.sourceType).toBe(Foo);
  expect(write.languageType.name).toBe("FooCreate");
  expect(write.languageType.properties.size).toBe(1);
  expect(write.languageType.name).toBe("FooCreate");
  expect(write.languageType.properties.size).toBe(1);
});

it("returns the same canonicalization for the same type", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read) createdAt: utcDateTime;
      name: string;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);

  const read1 = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });
  const read2 = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  expect(read1 === read2).toBe(true);
});

it("handles referring to the same canonicalization", async () => {
  const runner = await Tester.createInstance();
  const { Foo, Bar, Baz, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read) createdAt: utcDateTime;
      name: string;
    }

    model ${t.model("Bar")} {
      foo: Foo;
    }

    model ${t.model("Baz")} {
      foo: Foo;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);

  const createFoo = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Create,
  }) as ModelHttpCanonicalization;

  const createBar = canonicalizer.canonicalize(Bar, {
    visibility: Visibility.Create,
  }) as ModelHttpCanonicalization;

  expect(createBar.properties.get("foo")!.type === createFoo).toBe(true);
  expectTypeEquals(createBar.properties.get("foo")!.languageType.type, createFoo.languageType);

  const createBaz = canonicalizer.canonicalize(Baz, {
    visibility: Visibility.Create,
  }) as ModelHttpCanonicalization;

  expect(createBaz.properties.get("foo")!.type === createFoo).toBe(true);
});

it("orders canonicalizations in an SCC set", async () => {
  const runner = await Tester.createInstance();
  const { ApiKey, Animal, BaseModel, DerivedModel, Dog, Cat, Wrapper, AnimalUnion, program } =
    await runner.compile(t.code`
    scalar ${t.scalar("ApiKey")} extends string;

    @discriminator("kind")
    model ${t.model("Animal")} {
      kind: string;
    }

    model ${t.model("Dog")} extends Animal {
      kind: "Dog";
    }

    model ${t.model("Cat")} extends Animal {
      kind: "Cat";
    }

    model ${t.model("BaseModel")} {
      shared: ApiKey;
    }

    model ${t.model("DerivedModel")} extends BaseModel {
      derived: string;
    }

    model ${t.model("Wrapper")} extends DerivedModel {
      pet: Animal;
    }

    union ${t.union("AnimalUnion")} {
      dog: Dog,
      cat: Cat,
    }
  `);

  const tk = $(program);
  const canonicalizer = new HttpCanonicalizer(tk);
  const options = new HttpCanonicalizationOptions({
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const apiKey = canonicalizer.canonicalize(ApiKey, options) as ScalarHttpCanonicalization;
  const baseModel = canonicalizer.canonicalize(BaseModel, options) as ModelHttpCanonicalization;
  const derivedModel = canonicalizer.canonicalize(
    DerivedModel,
    options,
  ) as ModelHttpCanonicalization;
  const wrapper = canonicalizer.canonicalize(Wrapper, options) as ModelHttpCanonicalization;
  const animal = canonicalizer.canonicalize(Animal, options) as ModelHttpCanonicalization;
  const dogModel = canonicalizer.canonicalize(Dog, options) as ModelHttpCanonicalization;
  const catModel = canonicalizer.canonicalize(Cat, options) as ModelHttpCanonicalization;
  const union = canonicalizer.canonicalize(AnimalUnion, options) as UnionHttpCanonicalization;

  const set = new SCCSet<HttpCanonicalization>(httpCanonicalizationDependencyConnector);
  set.addAll([apiKey, baseModel, derivedModel, wrapper, animal, dogModel, catModel, union]);

  const indexOf = (value: HttpCanonicalization) => {
    expect(value).toBeDefined();
    const idx = set.items.indexOf(value);
    expect(idx).toBeGreaterThanOrEqual(0);
    return idx;
  };

  const expectBefore = (dependency: HttpCanonicalization, dependent: HttpCanonicalization) => {
    expect(dependency).toBeDefined();
    expect(dependent).toBeDefined();
    expect(indexOf(dependency)).toBeLessThan(indexOf(dependent));
  };

  expectBefore(baseModel, derivedModel);
  expectBefore(derivedModel, wrapper);
  expectBefore(dogModel, union);
  expectBefore(catModel, union);
});

it("detects identity codec subgraphs", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      name: string;
    }
  `);

  const canonicalizer = new HttpCanonicalizer($(program));
  const options = new HttpCanonicalizationOptions({
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const foo = canonicalizer.canonicalize(Foo, options);

  expect(canonicalizer.subgraphUsesIdentityCodec(foo)).toBe(true);
  expect(foo.subgraphUsesIdentityCodec()).toBe(true);
});

it("detects non-identity codec subgraphs", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      createdAt: utcDateTime;
    }
  `);

  const canonicalizer = new HttpCanonicalizer($(program));
  const options = new HttpCanonicalizationOptions({
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const foo = canonicalizer.canonicalize(Foo, options);
  expect(canonicalizer.subgraphUsesIdentityCodec(foo)).toBe(false);
  expect(foo.subgraphUsesIdentityCodec()).toBe(false);
});

it("propagates non-identity codecs to dependent components", async () => {
  const runner = await Tester.createInstance();
  const { Wrapper, program } = await runner.compile(t.code`
    model ${t.model("Plain")} {
      name: string;
    }

    model ${t.model("Encoded")} {
      @encode(DateTimeKnownEncoding.rfc7231)
      createdAt: utcDateTime;
    }

    model ${t.model("Wrapper")} {
      plain: Plain;
      encoded: Encoded;
    }
  `);

  const canonicalizer = new HttpCanonicalizer($(program));
  const options = new HttpCanonicalizationOptions({
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const wrapper = canonicalizer.canonicalize(Wrapper, options) as ModelHttpCanonicalization;
  const plain = wrapper.properties.get("plain")!.type as ModelHttpCanonicalization;
  const encoded = wrapper.properties.get("encoded")!.type as ModelHttpCanonicalization;
  expect(canonicalizer.subgraphUsesIdentityCodec(plain)).toBe(true);
  expect(canonicalizer.subgraphUsesIdentityCodec(wrapper)).toBe(false);
  expect(plain.subgraphUsesIdentityCodec()).toBe(true);
  expect(encoded.subgraphUsesIdentityCodec()).toBe(false);
  expect(wrapper.subgraphUsesIdentityCodec()).toBe(false);
});

it("marks every canonicalization in a strongly connected component as non-identity when one member is encoded", async () => {
  const runner = await Tester.createInstance();
  const { NodeA, NodeB, program } = await runner.compile(t.code`
    model ${t.model("NodeA")} {
      nodeB: NodeB;
      @encode(DateTimeKnownEncoding.rfc7231)
      createdAt: utcDateTime;
    }

    model ${t.model("NodeB")} {
      nodeA: NodeA;
    }
  `);

  const canonicalizer = new HttpCanonicalizer($(program));
  const options = new HttpCanonicalizationOptions({
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const nodeA = canonicalizer.canonicalize(NodeA, options) as ModelHttpCanonicalization;
  const nodeB = canonicalizer.canonicalize(NodeB, options) as ModelHttpCanonicalization;

  expect(canonicalizer.subgraphUsesIdentityCodec(nodeA)).toBe(false);
  expect(nodeA.subgraphUsesIdentityCodec()).toBe(false);
  expect(nodeB.subgraphUsesIdentityCodec()).toBe(false);
  expect(canonicalizer.subgraphUsesIdentityCodec(nodeB)).toBe(false);
});
