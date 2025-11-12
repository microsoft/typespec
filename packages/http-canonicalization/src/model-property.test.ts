import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("canonicalizes properties with encoding differently than the referenced type", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @encode(DateTimeKnownEncoding.rfc7231)
      ${t.modelProperty("one")}: utcDateTime;

      @encode(DateTimeKnownEncoding.rfc3339)
      ${t.modelProperty("two")}: utcDateTime;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const canonicalized = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  const one = canonicalized.properties.get("one")!;
  const two = canonicalized.properties.get("two")!;

  expectTypeEquals(one.languageType.type, tk.builtin.utcDateTime);
  expectTypeEquals(one.wireType.type, tk.builtin.string);

  expectTypeEquals(two.languageType.type, tk.builtin.utcDateTime);
  expectTypeEquals(two.wireType.type, tk.builtin.string);

  const oneType = one.type as ScalarHttpCanonicalization;
  const twoType = two.type as ScalarHttpCanonicalization;

  expect(oneType.codec.id).toBe("rfc7231");
  expect(twoType.codec.id).toBe("rfc3339");
});

// skip, haven't implemented metadata stuff yet
it("removes metadata properties from wire type", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @visibility(Lifecycle.Read)
      @header etag: string;

      id: string;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const write = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  expect(write.languageType.properties.has("etag")).toBe(true);
  expect(write.wireType.properties.has("etag")).toBe(false);
});
