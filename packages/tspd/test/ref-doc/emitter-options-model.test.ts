import { Model, resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { extractEmitterOptionsRefDocFromModel } from "../../src/ref-doc/extractor.js";

const Tester = createTester(resolvePath(import.meta.dirname, "..", ".."), {
  libraries: [],
});

async function extractOptions(code: string) {
  const [{ program }] = await Tester.compileAndDiagnose(code);
  const model = program.getGlobalNamespaceType().models.get("EmitterOptions");
  if (model === undefined) {
    throw new Error("Expected an `EmitterOptions` model in the compiled program");
  }
  return extractEmitterOptionsRefDocFromModel(program, model as Model);
}

describe("ref-doc: emitter options from TypeSpec model", () => {
  it("maps scalar and boolean options", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        name?: string;
        flag?: boolean;
      }
    `);
    expect(options).toEqual([
      { name: "name", type: "string", doc: "" },
      { name: "flag", type: "boolean", doc: "" },
    ]);
  });

  it("maps a union of string literals to allowed values", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        strategy?: "a" | "b" | "c";
      }
    `);
    expect(options[0]).toEqual({
      name: "strategy",
      type: `"a" | "b" | "c"`,
      doc: "",
      allowedValues: [`"a"`, `"b"`, `"c"`],
    });
  });

  it("reads doc and @default tag", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        /**
         * The newline character.
         * @default "lf"
         */
        \`new-line\`?: "crlf" | "lf";
      }
    `);
    expect(options[0]).toMatchObject({
      name: "new-line",
      type: `"crlf" | "lf"`,
      doc: "The newline character.",
      default: `"lf"`,
      allowedValues: [`"crlf"`, `"lf"`],
    });
  });

  it("maps an array of literals using allowed values", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        versions?: ("3.0.0" | "3.1.0")[];
      }
    `);
    expect(options[0]).toEqual({
      name: "versions",
      type: `("3.0.0" | "3.1.0")[]`,
      doc: "",
      allowedValues: [`"3.0.0"`, `"3.1.0"`],
    });
  });

  it("maps a union of literals and an array to variants", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        \`file-type\`?: ("yaml" | "json") | ("yaml" | "json")[];
      }
    `);
    expect(options[0]).toMatchObject({
      name: "file-type",
      type: `"yaml" | "json" | ("yaml" | "json")[]`,
      variants: [
        { type: `"yaml" | "json"`, allowedValues: [`"yaml"`, `"json"`] },
        { type: `("yaml" | "json")[]` },
      ],
    });
  });

  it("maps a union of literals and an object to variants with nested options", async () => {
    const options = await extractOptions(`
      model EmitterOptions {
        strategy?: "fqn" | {
          kind: "fqn" | "explicit-only";
          separator?: string;
        };
      }
    `);
    const option = options[0];
    expect(option.name).toEqual("strategy");
    expect(option.type).toEqual(`"fqn" | object { kind, separator }`);
    expect(option.variants?.[0]).toEqual({
      type: `"fqn"`,
      allowedValues: [`"fqn"`],
    });
    const objectVariant = option.variants?.[1];
    expect(objectVariant?.type).toEqual("object { kind, separator }");
    expect(objectVariant?.nestedOptions).toEqual([
      {
        name: "kind",
        type: `"fqn" | "explicit-only"`,
        doc: "",
        allowedValues: [`"fqn"`, `"explicit-only"`],
      },
      { name: "separator", type: "string", doc: "" },
    ]);
  });
});
