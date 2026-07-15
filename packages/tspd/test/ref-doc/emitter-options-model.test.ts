import { Model, resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
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

it("appends @example tags to option docs", async () => {
  const options = await extractOptions(`
    model EmitterOptions {
      /**
       * Name of the output file.
       *
       * @example Single service no versioning
       *  - \`openapi.yaml\`
       *
       * @example Multiple services no versioning
       *  - \`openapi.Org1.Service1.yaml\`
       *  - \`openapi.Org1.Service2.yaml\`
       */
      \`output-file\`?: string;
    }
  `);

  expect(options[0].doc).toContain("Name of the output file.");
  expect(options[0].doc).toContain("Example Single service no versioning");
  expect(options[0].doc).toContain("- `openapi.yaml`");
  expect(options[0].doc).toContain("Example Multiple services no versioning");
  expect(options[0].doc).toContain("- `openapi.Org1.Service2.yaml`");
});

it("reads @default tags from nested object properties", async () => {
  const options = await extractOptions(`
    model EmitterOptions {
      strategy?: "fqn" | {
        /**
         * Strategy kind.
         * @default "parent-container"
         */
        kind: "parent-container" | "fqn" | "explicit-only";
      };
    }
  `);

  expect(options[0].variants?.[1].nestedOptions?.[0]).toMatchObject({
    name: "kind",
    default: `"parent-container"`,
  });
});

it("propagates shorthand defaults to nested kind properties", async () => {
  const options = await extractOptions(`
    model EmitterOptions {
      /**
       * Strategy option.
       * @default "parent-container"
       */
      strategy?: "parent-container" | "fqn" | {
        kind: "parent-container" | "fqn";
        separator?: string;
      };
    }
  `);

  expect(options[0].variants?.[1].nestedOptions?.[0]).toMatchObject({
    name: "kind",
    default: `"parent-container"`,
  });
});

it("excludes @internal option properties", async () => {
  const options = await extractOptions(`
    model EmitterOptions {
      /** Public option. */
      visible?: string;

      /**
       * Internal option.
       * @internal
       */
      hidden?: string;

      nested?: {
        /** Public nested option. */
        enabled?: boolean;

        /**
         * Internal nested option.
         * @internal
         */
        secret?: string;
      };
    }
  `);

  expect(options.map((x) => x.name)).toEqual(["visible", "nested"]);
  expect(options[1].type).toEqual("object { enabled }");
  expect(options[1].nestedOptions?.map((x) => x.name)).toEqual(["enabled"]);
});
