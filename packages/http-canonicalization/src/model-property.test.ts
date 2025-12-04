import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import {
  ArrayJoinCodec,
  Base64Codec,
  CodecRegistry,
  CoerceToFloat64Codec,
  IdentityCodec,
  RenameCodec,
  Rfc3339Codec,
  Rfc7231Codec,
  UnixTimestamp32Codec,
  UnixTimestamp64Codec,
} from "./codecs.js";
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
    contentType: "application/json",
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

it("makes nullable properties optional on the wire", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      id: string | null;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const foo = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });
  const prop = foo.properties.get("id")!;
  expect(prop.typeIsNullable).toBe(true);

  const langType = prop.languageType;
  expect(langType.optional).toBe(false);

  const wireType = prop.wireType;
  expect(wireType.optional).toBe(true);
});

it("applies friendly name", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      @friendlyName("FooId")
      id: string | null;
    }
  `);

  const tk = $(program);

  const canonicalizer = new HttpCanonicalizer(tk);
  const foo = canonicalizer.canonicalize(Foo, {
    visibility: Visibility.Read,
    contentType: "application/json",
  });

  const prop = foo.properties.get("id")!;
  expect(prop).toBeDefined();
  expect(prop.languageType.name).toBe("FooId");
  expect(prop.wireType.name).toBe("id");
});

it("Applies renames", async () => {
  const { program, test } = await runner.compile(t.code`
    op ${t.op("test")}(): Foo;

    model ${t.model("Foo")} {
      rename_thing: string;
    }
  `);

  const tk = $(program);
  const codecs = new CodecRegistry(tk);
  codecs.addCodec(new CoerceToFloat64Codec());
  codecs.addCodec(new Rfc7231Codec());
  codecs.addCodec(new UnixTimestamp32Codec());
  codecs.addCodec(new UnixTimestamp64Codec());
  codecs.addCodec(new Rfc3339Codec());
  codecs.addCodec(new Base64Codec());
  codecs.addCodec(new Base64Codec());
  codecs.addCodec(new ArrayJoinCodec());
  codecs.addCodec(
    new RenameCodec({
      namer(type) {
        return (type as any).name + "Renamed";
      },
    }),
  );
  codecs.addCodec(new IdentityCodec());
  const canonicalizer = new HttpCanonicalizer(tk, codecs);

  const canonTest = canonicalizer.canonicalize(test);
  const model = (canonTest as any).responses[0].responses[0].body.bodies[0].type;
  expect(model.languageType.properties.size).toBe(1);
  expect(model.languageType.properties.has("rename_thingRenamed")).toBe(true);
});
