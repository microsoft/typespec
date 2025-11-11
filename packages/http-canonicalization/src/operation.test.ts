import type { Model } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, describe, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import { ModelHttpCanonicalization } from "./model.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

describe("Operation parameters", async () => {
  it("works with implicit request bodies", async () => {
    const { createFoo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Read) createdAt: utcDateTime;
        name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(foo: Foo): Foo;
    `);

    const tk = $(program);

    const canonicalizer = new HttpCanonicalizer(tk);
    const createFooCanonical = canonicalizer.canonicalize(createFoo);
    const bodyType = createFooCanonical.requestParameters.body!.type as ModelHttpCanonicalization;
    expect(bodyType).toBeDefined();
    expect(bodyType).toBeInstanceOf(ModelHttpCanonicalization);
    const fooProp = bodyType.properties.get("foo")!;
    expect(fooProp).toBeDefined();

    const fooType = fooProp.type as ModelHttpCanonicalization;
    expect(fooType.languageType.name).toBe("FooCreate");
    expect(fooType.visibleProperties.size).toBe(1);
    expect(fooType.visibleProperties.has("name")).toBe(true);
    expect(fooType.visibleProperties.has("createdAt")).toBe(false);
  });

  it("works with explicit request bodies", async () => {
    const { createFoo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Read) createdAt: utcDateTime;
        name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(@body foo: Foo): Foo;
    `);

    const tk = $(program);
    const canonicalizer = new HttpCanonicalizer(tk);
    const createFooCanonical = canonicalizer.canonicalize(createFoo);
    const bodyType = createFooCanonical.requestParameters.body!.type as ModelHttpCanonicalization;
    expect(bodyType).toBeDefined();
    expect(bodyType).toBeInstanceOf(ModelHttpCanonicalization);
    expect(bodyType.languageType.name).toBe("FooCreate");
  });

  it("works with headers", async () => {
    const { createFoo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Read) createdAt: utcDateTime;
        name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(@header \`if-modified-since\`: utcDateTime, @body body: Foo): Foo;
    `);

    const tk = $(program);
    const canonicalizer = new HttpCanonicalizer(tk);
    const createFooCanonical = canonicalizer.canonicalize(createFoo);
    const dateProp = createFooCanonical.requestParameters.properties[0];
    expect(dateProp.kind).toBe("header");
    const scalarType = dateProp.property.type as ScalarHttpCanonicalization;
    expect(scalarType.wireType === tk.builtin.string).toBe(true);
    expect(scalarType.codec.id).toBe("rfc7231");
    expect(createFooCanonical.requestParameters.properties.length).toBe(2);
  });

  it("works with merge patch", async () => {
    const { updateFoo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Read) createdAt: utcDateTime;
        name: string;
      }

      @route("/foo")
      @patch
      op ${t.op("updateFoo")}(@body body: MergePatchUpdate<Foo>): Foo;
    `);

    const tk = $(program);
    const canonicalizer = new HttpCanonicalizer(tk);
    const updateFooCanonical = canonicalizer.canonicalize(updateFoo);
    const bodyProp = updateFooCanonical.requestParameters.body!.property!;
    expect(bodyProp.languageType.name).toBe("body");
    expect((bodyProp.languageType.type as Model).name).toBe("FooMergePatchUpdate");
    const body = updateFooCanonical.requestParameters.body!;
    expect(body.bodyKind).toBe("single");
    expect(body.type).toBeInstanceOf(ModelHttpCanonicalization);
    expect((body.type.languageType as Model).name).toBe("FooMergePatchUpdate");
  });
});

describe("Operation responses", async () => {
  it("canonicalizes response body and headers", async () => {
    const { getFoo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @visibility(Lifecycle.Read) createdAt: utcDateTime;
        name: string;
      }

      @route("/foo")
      @get
      op ${t.op("getFoo")}(): {
        @statusCode status: 200;
        @header etag: string;
        @body result: Foo;
      };
    `);

    const tk = $(program);
    const canonicalizer = new HttpCanonicalizer(tk);
    const canonical = canonicalizer.canonicalize(getFoo);

    expect(canonical.responses.length).toBe(1);
    const response = canonical.responses[0]!;
    expect(response.statusCodes).toBe(200);

    const content = response.responses[0]!;
    expect(content.headers).toBeDefined();
    const etagHeader = content.headers!.etag;
    expect(etagHeader).toBeDefined();
    const etagType = etagHeader!.type as ScalarHttpCanonicalization;
    expect(etagType.wireType === tk.builtin.string).toBe(true);

    expect(content.body).toBeDefined();
    const body = content.body!;
    expect(body.bodyKind).toBe("single");

    const bodyType = body.type as ModelHttpCanonicalization;
    expect(bodyType.visibleProperties.has("name")).toBe(true);
    expect(bodyType.visibleProperties.has("createdAt")).toBe(true);
  });
});
