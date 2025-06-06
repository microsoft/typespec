import { Model, ModelProperty, Program, Type } from "@typespec/compiler";
import { BasicTestRunner, expectTypeEquals } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import { isHeader } from "../src/decorators.js";
import { isMetadata } from "../src/metadata.js";
import { createHttpTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createHttpTestRunner();
});

async function compile(
  ref: string,
  extra?: string,
): Promise<{ target: Model; program: Program } & Record<string, Type>> {
  const { target, ...others } = await runner.compile(`
    model Test {
      @test target: ${ref};
    }
    ${extra ?? ""}
  `);

  return {
    ...others,
    program: runner.program,
    target: (target as ModelProperty).type as Model,
  } as any;
}

describe("OmitMetadata<T>", () => {
  describe("omit properties with decorator", () => {
    it.each(["@header", "@query", "@path", "@statusCode", "@cookie"])("%s", async (dec) => {
      const { target } = await compile(`
       OmitMetadata<{
         ${dec} a: string;
         b: string;
       }>
      `);
      expect(target.properties.size).toBe(1);
      expect(target.properties.has("a")).toBe(false);
      expect(target.properties.has("b")).toBe(true);
    });
  });

  it("omit multiple properties", async () => {
    const { target } = await compile(`
        OmitMetadata<{
          @header a: string;
          b: string;
          @header c: string;
          d: string;
        }>
      `);
    expect(target.properties.size).toBe(2);
    expect(target.properties.has("a")).toBe(false);
    expect(target.properties.has("b")).toBe(true);
    expect(target.properties.has("c")).toBe(false);
    expect(target.properties.has("d")).toBe(true);
  });

  it("doesn't affect model using it with model is", async () => {
    const { target } = await compile(
      `Foo`,
      `
      model Foo is OmitMetadata<{
          @header a: string;
          b: string;
        }> {
           @header c: string;
        }
      `,
    );
    expect(target.properties.size).toBe(2);
    expect(target.properties.has("a")).toBe(false);
    expect(target.properties.has("b")).toBe(true);
    expect(target.properties.has("c")).toBe(true);
  });

  it("omit nested properties too", async () => {
    const { target } = await compile(`
        OmitMetadata<{
          @header a: string;
          nested: {
            @header c: string;
            d: string;
          }
        }>
      `);
    expect(target.properties.size).toBe(1);
    expect(target.properties.has("a")).toBe(false);
    const nested = target.properties.get("nested")?.type;
    strictEqual(nested?.kind, "Model");
    expect(nested.properties.has("c")).toBe(false);
    expect(nested.properties.has("d")).toBe(true);
  });

  it("keeps original type if it doesn't need to be updated", async () => {
    const { target, Foo } = await compile(
      `
        OmitMetadata<{
          @header a: string;
          nested: Foo;
        }>
      `,
      `
      @test model Foo {a: string; b: string;}
      `,
    );
    const nested = target.properties.get("nested")?.type;
    expectTypeEquals(nested, Foo);
  });

  describe("names of cloned types", () => {
    it("models have anonymous names by default", async () => {
      const { target } = await compile(
        `
        OmitMetadata<A>
      `,
        `
      model A {
        @header a: string;
        b: B;
      }
      model B { @header b: string;}
      `,
      );
      expect(target.name).toBe("");
      const bType = target.properties.get("b")?.type;
      strictEqual(bType?.kind, "Model");
      expect(bType.name).toBe("");
    });

    it("use template if provided", async () => {
      const { target } = await compile(
        `
        OmitMetadata<A, "{name}Suffix">
      `,
        `
      model A {
        @header a: string;
        b: B;
      }
      model B { @header b: string;}
      `,
      );
      expect(target.name).toBe("ASuffix");
      const bType = target.properties.get("b")?.type;
      strictEqual(bType?.kind, "Model");
      expect(bType.name).toBe("BSuffix");
    });
  });
});

describe("StripMetadata<T>", () => {
  describe("omit properties with decorator", () => {
    it.each(["@header", "@query", "@path", "@statusCode", "@cookie"])("%s", async (dec) => {
      const { program, target } = await compile(`
       StripMetadata<{
         ${dec} a: string;
         b: string;
       }>
      `);
      expect(target.properties.size).toBe(2);
      expect(isMetadata(program, target.properties.get("a")!)).toBe(false);
    });
  });

  it("omit multiple properties", async () => {
    const { target, program } = await compile(`
        StripMetadata<{
          @header a: string;
          @header b: string;
        }>
      `);
    expect(isMetadata(program, target.properties.get("a")!)).toBe(false);
    expect(isMetadata(program, target.properties.get("b")!)).toBe(false);
  });

  it("omit nested properties too", async () => {
    const { target, program } = await compile(`
        StripMetadata<{
          a: string;
          nested: {
            @header c: string;
            d: string;
          }
        }>
      `);
    const nested = target.properties.get("nested")?.type;
    strictEqual(nested?.kind, "Model");
    expect(isMetadata(program, nested.properties.get("c")!)).toBe(false);
  });

  it("doesn't affect model using it with model is", async () => {
    const { target, program } = await compile(
      `Foo`,
      `
      model Foo is StripMetadata<{
          @header a: string;
          b: string;
        }> {
           @header c: string;
        }
      `,
    );
    expect(target.properties.size).toBe(3);
    expect(isHeader(program, target.properties.get("a")!)).toBe(false);
    expect(isHeader(program, target.properties.get("b")!)).toBe(false);
    expect(isHeader(program, target.properties.get("c")!)).toBe(true);
  });

  it("keeps original type if it doesn't need to be updated", async () => {
    const { target, Foo } = await compile(
      `
        StripMetadata<{
          @header a: string;
          nested: Foo;
        }>
      `,
      `
      @test model Foo {a: string; b: string;}
      `,
    );
    const nested = target.properties.get("nested")?.type;
    expectTypeEquals(nested, Foo);
  });

  describe("names of cloned types", () => {
    it("models have anonymous names by default", async () => {
      const { target } = await compile(
        `
        StripMetadata<A>
      `,
        `
      model A {
        @header a: string;
        b: B;
      }
      model B { @header b: string;}
      `,
      );
      expect(target.name).toBe("");
      const bType = target.properties.get("b")?.type;
      strictEqual(bType?.kind, "Model");
      expect(bType.name).toBe("");
    });

    it("use template if provided", async () => {
      const { target } = await compile(
        `
        StripMetadata<A, "{name}Suffix">
      `,
        `
      model A {
        @header a: string;
        b: B;
      }
      model B { @header b: string;}
      `,
      );
      expect(target.name).toBe("ASuffix");
      const bType = target.properties.get("b")?.type;
      strictEqual(bType?.kind, "Model");
      expect(bType.name).toBe("BSuffix");
    });
  });
});
