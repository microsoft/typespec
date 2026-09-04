import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import {
  getBaseUri,
  getContentEncoding,
  getId,
  getMinContains,
  getMultipleOf,
  getMultipleOfAsNumeric,
  getPrefixItems,
  getUniqueItems,
  isOneOf,
} from "../src/decorators.js";
import { ApiTester, emitSchema } from "./utils.js";

// The metadata-only decorators of this library are declared as `auto dec`, which is gated behind
// the experimental `auto-decorators` compiler feature. The library opts itself in via its own
// tspconfig.yaml, so a consumer project must be able to use them without enabling anything.
it("consumers can use the decorators without enabling the auto-decorators feature", async () => {
  await emitSchema(`
    @oneOf
    union Pet {
      cat: string,
      dog: int32,
    }

    @id("custom-id")
    model Foo {
      @uniqueItems tags: string[];
      @multipleOf(10) count: int32;
      @contentEncoding("base64url") blob: string;
    }
  `);
});

it("exposes the stored values through the public accessors", async () => {
  const { Foo, Pet, tags, count, blob, program } = await ApiTester.compile(t.code`
    @id("custom-id")
    model ${t.model("Foo")} {
      @uniqueItems ${t.modelProperty("tags")}: string[];
      @multipleOf(10) ${t.modelProperty("count")}: int32;
      @contentEncoding("base64url") ${t.modelProperty("blob")}: string;
    }

    @oneOf
    union ${t.union("Pet")} {
      cat: string,
      dog: int32,
    }
  `);

  expect(getId(program, Foo)).toEqual("custom-id");
  expect(isOneOf(program, Pet)).toBe(true);
  expect(getUniqueItems(program, tags)).toBe(true);
  expect(getMultipleOf(program, count)).toEqual(10);
  expect(getMultipleOfAsNumeric(program, count)?.asNumber()).toEqual(10);
  expect(getContentEncoding(program, blob)).toEqual("base64url");
});

it("returns undefined from accessors when the decorator is not applied", async () => {
  const { plain, program } = await ApiTester.compile(t.code`
    model Foo {
      ${t.modelProperty("plain")}: string[];
    }
  `);

  expect(getUniqueItems(program, plain)).toBeUndefined();
  expect(getMinContains(program, plain)).toBeUndefined();
  expect(getPrefixItems(program, plain)).toBeUndefined();
  expect(isOneOf(program, plain)).toBe(false);
});

it("resolves the base uri from the enclosing namespace", async () => {
  const { Foo, program } = await ApiTester.compile(t.code`
    @baseUri("https://example.com/schemas/")
    namespace Schemas {
      model ${t.model("Foo")} {}
    }
  `);

  expect(getBaseUri(program, Foo.namespace!)).toEqual("https://example.com/schemas/");
  expect(getBaseUri(program, Foo)).toBeUndefined();
});

it("warns when a metadata decorator is applied twice on the same declaration", async () => {
  const [, diagnostics] = await ApiTester.compileAndDiagnose(`
    model Foo {
      @minContains(1)
      @minContains(2)
      values: string[];
    }
  `);

  expect(diagnostics.map((d) => d.code)).toContain("duplicate-decorator");
});
