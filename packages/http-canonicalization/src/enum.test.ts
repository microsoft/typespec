import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Visibility } from "@typespec/http";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../test/test-host.js";
import { EnumMemberHttpCanonicalization } from "./enum-member.js";
import { EnumHttpCanonicalization } from "./enum.js";
import { HttpCanonicalizer } from "./http-canonicalization.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("canonicalizes a simple enum", async () => {
  const { Color, program } = await runner.compile(t.code`
    enum ${t.enum("Color")} { Red, Green, Blue }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Color, {
    visibility: Visibility.Read,
  });

  expect(canonical).toBeInstanceOf(EnumHttpCanonicalization);
  const enumCanonical = canonical as EnumHttpCanonicalization;

  // The source type should be the original enum
  expectTypeEquals(enumCanonical.sourceType, Color);

  // Language and wire types should be identical for a simple enum
  expectTypeEquals(enumCanonical.languageType, enumCanonical.wireType);

  // Should be a declaration
  expect(enumCanonical.isDeclaration).toBe(true);

  // Should have three members
  expect(enumCanonical.members.size).toBe(3);
  expect(enumCanonical.members.has("Red")).toBe(true);
  expect(enumCanonical.members.has("Green")).toBe(true);
  expect(enumCanonical.members.has("Blue")).toBe(true);
});

it("canonicalizes an enum with string values", async () => {
  const { Status, program } = await runner.compile(t.code`
    enum ${t.enum("Status")} {
      Active: "active",
      Inactive: "inactive",
      Pending: "pending"
    }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Status, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  expect(canonical.members.size).toBe(3);

  const activeCanonical = canonical.members.get("Active");
  expect(activeCanonical).toBeInstanceOf(EnumMemberHttpCanonicalization);
  expect(activeCanonical!.sourceType.value).toBe("active");
});

it("canonicalizes an enum with numeric values", async () => {
  const { Priority, program } = await runner.compile(t.code`
    enum ${t.enum("Priority")} {
      Low: 1,
      Medium: 2,
      High: 3
    }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Priority, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  expect(canonical.members.size).toBe(3);

  const lowCanonical = canonical.members.get("Low");
  expect(lowCanonical).toBeInstanceOf(EnumMemberHttpCanonicalization);
  expect(lowCanonical!.sourceType.value).toBe(1);

  const highCanonical = canonical.members.get("High");
  expect(highCanonical!.sourceType.value).toBe(3);
});

it("enum has no codec", async () => {
  const { Color, program } = await runner.compile(t.code`
    enum ${t.enum("Color")} { Red, Green, Blue }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Color, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  expect(canonical.codec).toBe(null);
});

it("uses identity codec for subgraph", async () => {
  const { Color, program } = await runner.compile(t.code`
    enum ${t.enum("Color")} { Red, Green, Blue }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Color, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  expect(canonical.subgraphUsesIdentityCodec()).toBe(true);
});

it("canonicalizes enum used in model property", async () => {
  const { Item, program } = await runner.compile(t.code`
    enum ${t.enum("Status")} { Active, Inactive }
    model ${t.model("Item")} {
      status: Status;
    }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Item, {
    visibility: Visibility.Read,
  });

  const statusProp = canonical.properties.get("status")!;
  expect(statusProp.type).toBeInstanceOf(EnumHttpCanonicalization);

  const enumType = statusProp.type as EnumHttpCanonicalization;
  expect(enumType.members.size).toBe(2);
  expect(enumType.members.has("Active")).toBe(true);
  expect(enumType.members.has("Inactive")).toBe(true);
});
