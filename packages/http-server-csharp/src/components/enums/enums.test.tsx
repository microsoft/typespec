import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import {
  Attribute,
  createCSharpNamePolicy,
  EnumDeclaration as CsEnumDeclaration,
  EnumMember,
  SourceFile,
} from "@alloy-js/csharp";
import { type Union } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { EnumDeclaration } from "@typespec/emitter-framework/csharp";
import { beforeEach, describe, expect, it } from "vitest";
import { getUnionEnumMembers, isUnionEnum } from "./enums.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.cs">{props.children}</SourceFile>
    </Output>
  );
}

/**
 * Renders a union-as-enum using the same logic as the Enums component,
 * but without the file/namespace/useTsp wrapping.
 */
function UnionEnumDecl(props: { union: Union }) {
  const members = getUnionEnumMembers(props.union);
  return (
    <CsEnumDeclaration name={props.union.name!} public>
      {members.map((member, i) => (
        <>
          <Attribute name="JsonStringEnumMemberName" args={[`"${member.value}"`]} />
          {"\n"}
          <EnumMember name={member.name} />
          {i < members.length - 1 ? ",\n" : ""}
        </>
      ))}
    </CsEnumDeclaration>
  );
}

describe("EnumDeclaration", () => {
  it("renders a simple enum", async () => {
    const { Color } = await runner.compile(t.code`
      enum ${t.enum("Color")} {
        Red,
        Green,
        Blue,
      }
    `);

    expect(
      <Wrapper>
        <EnumDeclaration type={Color} />
      </Wrapper>,
    ).toRenderTo(`
      enum Color
      {
          Red,
          Green,
          Blue
      }
    `);
  });

  it("renders an enum with multiple members", async () => {
    const { Direction } = await runner.compile(t.code`
      enum ${t.enum("Direction")} {
        North,
        South,
        East,
        West,
      }
    `);

    expect(
      <Wrapper>
        <EnumDeclaration type={Direction} />
      </Wrapper>,
    ).toRenderTo(`
      enum Direction
      {
          North,
          South,
          East,
          West
      }
    `);
  });

  it("renders an enum with a type-level doc comment", async () => {
    const { Color } = await runner.compile(t.code`
      /** Represents available colors */
      enum ${t.enum("Color")} {
        Red,
        Green,
        Blue,
      }
    `);

    expect(
      <Wrapper>
        <EnumDeclaration type={Color} />
      </Wrapper>,
    ).toRenderTo(`
      /// <summary>
      /// Represents available colors
      /// </summary>
      enum Color
      {
          Red,
          Green,
          Blue
      }
    `);
  });
});

describe("isUnionEnum", () => {
  it("returns true for extensible union with string base and named variants", async () => {
    const { ReasoningEffort } = await runner.compile(t.code`
      union ${t.union("ReasoningEffort")} {
        string,
        none: "none",
        low: "low",
        medium: "medium",
        high: "high",
      }
    `);

    expect(isUnionEnum(ReasoningEffort)).toBe(true);
  });

  it("returns true for fixed union with named variants only", async () => {
    const { Priority } = await runner.compile(t.code`
      union ${t.union("Priority")} {
        low: "low",
        medium: "medium",
        high: "high",
      }
    `);

    expect(isUnionEnum(Priority)).toBe(true);
  });

  it("returns false for union with non-string variant types", async () => {
    const { Mixed } = await runner.compile(t.code`
      model Foo { x: string; }
      union ${t.union("Mixed")} {
        Foo,
        "bar",
      }
    `);

    expect(isUnionEnum(Mixed)).toBe(false);
  });
});

describe("union-as-enum rendering", () => {
  it("renders union with unnamed string literals", async () => {
    const { Priority } = await runner.compile(t.code`
      union ${t.union("Priority")} {
        "low",
        "medium",
        "high",
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={Priority} />
      </Wrapper>,
    ).toRenderTo(`
      public enum Priority
      {
          [JsonStringEnumMemberName("low")]
          Low,
          [JsonStringEnumMemberName("medium")]
          Medium,
          [JsonStringEnumMemberName("high")]
          High
      }
    `);
  });

  it("renders union with unnamed string literals and null (null is skipped)", async () => {
    const { ReasoningEffort } = await runner.compile(t.code`
      union ${t.union("ReasoningEffort")} {
        "none",
        "minimal",
        "low",
        "medium",
        "high",
        null,
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={ReasoningEffort} />
      </Wrapper>,
    ).toRenderTo(`
      public enum ReasoningEffort
      {
          [JsonStringEnumMemberName("none")]
          None,
          [JsonStringEnumMemberName("minimal")]
          Minimal,
          [JsonStringEnumMemberName("low")]
          Low,
          [JsonStringEnumMemberName("medium")]
          Medium,
          [JsonStringEnumMemberName("high")]
          High
      }
    `);
  });

  it("renders union with named variants and null (null is skipped)", async () => {
    const { ReasoningEffort } = await runner.compile(t.code`
      union ${t.union("ReasoningEffort")} {
        none: "none",
        medium: "medium",
        high: "high",
        null,
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={ReasoningEffort} />
      </Wrapper>,
    ).toRenderTo(`
      public enum ReasoningEffort
      {
          [JsonStringEnumMemberName("none")]
          None,
          [JsonStringEnumMemberName("medium")]
          Medium,
          [JsonStringEnumMemberName("high")]
          High
      }
    `);
  });

  it("renders extensible union with string base, named variants, and null", async () => {
    const { ReasoningEffort } = await runner.compile(t.code`
      union ${t.union("ReasoningEffort")} {
        string,
        none: "none",
        medium: "medium",
        high: "high",
        null,
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={ReasoningEffort} />
      </Wrapper>,
    ).toRenderTo(`
      public enum ReasoningEffort
      {
          [JsonStringEnumMemberName("none")]
          None,
          [JsonStringEnumMemberName("medium")]
          Medium,
          [JsonStringEnumMemberName("high")]
          High
      }
    `);
  });

  it("renders union with inline anonymous union of string literals and null", async () => {
    const { ReasoningEffort } = await runner.compile(t.code`
      union ${t.union("ReasoningEffort")} {
        "none" | "minimal" | "low" | "medium" | "high",
        null,
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={ReasoningEffort} />
      </Wrapper>,
    ).toRenderTo(`
      public enum ReasoningEffort
      {
          [JsonStringEnumMemberName("none")]
          None,
          [JsonStringEnumMemberName("minimal")]
          Minimal,
          [JsonStringEnumMemberName("low")]
          Low,
          [JsonStringEnumMemberName("medium")]
          Medium,
          [JsonStringEnumMemberName("high")]
          High
      }
    `);
  });
});

// Cases ported from the legacy string-matching suite (test/generation.test.ts).
describe("ported from generation.test.ts", () => {
  // Ports generation.test.ts:677 "handles integer enums" (the enum-render part).
  // A named-integer enum renders as a plain C# enum: member names + doc comments,
  // and the integer values are intentionally dropped (no `= 1`). The property-side
  // mapping (`IntegerEnum?` / `IntegerEnum` on a model) is a model concern and is
  // covered by e2e/models tests.
  it("renders an integer-valued enum, dropping the numeric values", async () => {
    const { IntegerEnum } = await runner.compile(t.code`
      /** An integer enum */
      enum ${t.enum("IntegerEnum")} {
        /** one */ One: 1,
        /** three */ Three: 3,
        /** five */ Five: 5,
      }
    `);

    expect(
      <Wrapper>
        <EnumDeclaration type={IntegerEnum} />
      </Wrapper>,
    ).toRenderTo(`
      /// <summary>
      /// An integer enum
      /// </summary>
      enum IntegerEnum
      {
          /// <summary>
          /// one
          /// </summary>
          One,
          /// <summary>
          /// three
          /// </summary>
          Three,
          /// <summary>
          /// five
          /// </summary>
          Five
      }
    `);
  });

  // Ports generation.test.ts:740 "handles extensible enums ..." (the enum-render
  // part). PetType is an *extensible* string union (open `string` variant) whose
  // C# member names (`Dog`, `Cat`) differ from their JSON serialized values
  // (`"dog"`, `"cat"`). The open `string` variant is dropped from the enum.
  it("renders an extensible string union with name != serialized value", async () => {
    const { PetType } = await runner.compile(t.code`
      /** An extensible string union */
      union ${t.union("PetType")} {
        /** Dog */ Dog: "dog",
        /** Cat */ Cat: "cat",
        string,
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={PetType} />
      </Wrapper>,
    ).toRenderTo(`
      public enum PetType
      {
          [JsonStringEnumMemberName("dog")]
          Dog,
          [JsonStringEnumMemberName("cat")]
          Cat
      }
    `);
  });

  // Ports generation.test.ts:740 "handles extensible enums ..." (the enum-render
  // part). AnimalType is a *fixed* string union (no open `string` variant); its
  // members likewise map capitalized C# names to lowercase JSON values.
  it("renders a fixed string union with name != serialized value", async () => {
    const { AnimalType } = await runner.compile(t.code`
      /** A fixed string union */
      union ${t.union("AnimalType")} {
        /** Wolf */ Wolf: "wolf",
        /** Bear */ Bear: "bear",
      }
    `);

    expect(
      <Wrapper>
        <UnionEnumDecl union={AnimalType} />
      </Wrapper>,
    ).toRenderTo(`
      public enum AnimalType
      {
          [JsonStringEnumMemberName("wolf")]
          Wolf,
          [JsonStringEnumMemberName("bear")]
          Bear
      }
    `);
  });
});
