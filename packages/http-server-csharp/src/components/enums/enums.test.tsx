import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { Attribute, createCSharpNamePolicy, EnumDeclaration as CsEnumDeclaration, EnumMember, SourceFile } from "@alloy-js/csharp";
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
