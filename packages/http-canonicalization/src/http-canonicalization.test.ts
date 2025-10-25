import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import type { ModelHttpCanonicalization } from "./model.js";
import { HttpCanonicalizationOptions } from "./options.js";

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
    new HttpCanonicalizationOptions({ visibility: Visibility.Read }),
  );
  expect(read.sourceType).toBe(Foo);

  // validate mutation node
  expect(read.properties.size).toBe(2);
  const deletedProperty = read.properties.get("name")! as ModelPropertyHttpCanonicalization;
  expect(deletedProperty.languageType).toBe(tk.intrinsic.never);

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
