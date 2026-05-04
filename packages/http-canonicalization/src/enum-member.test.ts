import { t, type TesterInstance } from "@typespec/compiler/testing";
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

it("canonicalizes enum members correctly", async () => {
  const { Color, program } = await runner.compile(t.code`
    enum ${t.enum("Color")} { Red, Green, Blue }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Color, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  const redMember = canonical.members.get("Red")!;

  expect(redMember).toBeInstanceOf(EnumMemberHttpCanonicalization);
  expect(redMember.isDeclaration).toBe(true);
  expect(redMember.codec).toBe(null);

  // Language and wire types should be the enum member
  expect(redMember.languageType.name).toBe("Red");
  expect(redMember.wireType.name).toBe("Red");
});

it("enum member has correct source type", async () => {
  const { Status, program } = await runner.compile(t.code`
    enum ${t.enum("Status")} {
      Active: "active",
      Inactive: "inactive"
    }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Status, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  const activeMember = canonical.members.get("Active")!;

  expect(activeMember.sourceType.name).toBe("Active");
  expect(activeMember.sourceType.value).toBe("active");
});

it("enum member uses identity codec for subgraph", async () => {
  const { Color, program } = await runner.compile(t.code`
    enum ${t.enum("Color")} { Red, Green, Blue }
  `);

  const tk = $(program);
  const engine = new HttpCanonicalizer(tk);

  const canonical = engine.canonicalize(Color, {
    visibility: Visibility.Read,
  }) as EnumHttpCanonicalization;

  const redMember = canonical.members.get("Red")!;

  expect(redMember.subgraphUsesIdentityCodec()).toBe(true);
});
