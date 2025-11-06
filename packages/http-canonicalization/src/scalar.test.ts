import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import { ScalarHttpCanonicalization } from "./scalar.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("canonicalizes a string", async () => {
  const { myString, program } = await runner.compile(t.code`
    scalar ${t.scalar("myString")} extends string;
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonicalMyString = engine.canonicalize(myString, {
    visibility: Visibility.Read,
  });

  // No mutation happens in this case, so:
  expect(canonicalMyString.sourceType === canonicalMyString.languageType).toBe(true);

  expect(canonicalMyString.sourceType === canonicalMyString.wireType).toBe(true);

  expect(canonicalMyString.codec.id).toBe("identity");
});

it("canonicalizes an int32 scalar", async () => {
  const { myNumber, program } = await runner.compile(t.code`
    scalar ${t.scalar("myNumber")} extends int32;
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonicalMyString = engine.canonicalize(myNumber, {
    visibility: Visibility.Read,
  });

  // We leave the language type the same
  expect(canonicalMyString.sourceType === canonicalMyString.languageType).toBe(true);

  // but the wire type is a float64
  expect(canonicalMyString.sourceType === canonicalMyString.wireType).toBe(false);
  expect(canonicalMyString.wireType === tk.builtin.float64).toBe(true);
  expect(canonicalMyString.codec.id).toBe("coerce-to-float64");
});

it("canonicalizes a utcDateTime scalar", async () => {
  const { myDateTime, program } = await runner.compile(t.code`
    scalar ${t.scalar("myDateTime")} extends utcDateTime;
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonicalMyString = engine.canonicalize(myDateTime, {
    visibility: Visibility.Read,
  });

  expect(canonicalMyString.wireType === tk.builtin.string).toBe(true);
  expect(canonicalMyString.codec.id).toBe("rfc3339");
});

it("canonicalizes a utcDateTime scalar with encode decorator", async () => {
  const { myDateTime, program } = await runner.compile(t.code`
      @encode(DateTimeKnownEncoding.rfc7231)
      scalar ${t.scalar("myDateTime")} extends utcDateTime;
    `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonicalMyString = engine.canonicalize(myDateTime, {
    visibility: Visibility.Read,
  });

  // the codec is set appropriately
  expect(canonicalMyString.codec.id).toBe("rfc7231");

  // We leave the language type the same
  expect(canonicalMyString.sourceType === canonicalMyString.languageType).toBe(true);

  // but the wire type is a string
  expect(canonicalMyString.sourceType === canonicalMyString.wireType).toBe(false);
  expect(canonicalMyString.wireType === tk.builtin.string).toBe(true);
});

it("canonicalizes a utcDateTime scalar with encode decorator on a member", async () => {
  const { Foo, program } = await runner.compile(t.code`
      model ${t.model("Foo")} {
        @encode(DateTimeKnownEncoding.rfc7231)
        @visibility(Lifecycle.Read)
        createdAt: utcDateTime;
      }
    `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);
  const canonicalFoo = engine.canonicalize(Foo, {
    visibility: Visibility.Read,
  });

  // navigating canonicalization
  const canonicalDateTime = canonicalFoo.properties.get("createdAt")!
    .type as ScalarHttpCanonicalization;

  expect(canonicalDateTime).toBeInstanceOf(ScalarHttpCanonicalization);
  expect(canonicalDateTime.wireType === tk.builtin.string).toBe(true);
  expect(canonicalDateTime.codec.id).toBe("rfc7231");

  // navigating mutated type
  const wireFoo = canonicalFoo.wireType;
  const wireDateType = wireFoo.properties.get("createdAt")!.type;
  expect(wireDateType === tk.builtin.string).toBe(true);
});
