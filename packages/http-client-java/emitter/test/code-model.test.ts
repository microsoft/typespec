import { NodeHost, compile } from "@typespec/compiler";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { CodeModelBuilder } from "../src/code-model-builder.js";
import { Client } from "../src/common/client.js";
import { CodeModel } from "../src/common/code-model.js";
import { Initializer } from "../src/common/codemodel-helpers.js";
import {
  AnySchema,
  ArraySchema,
  BinaryResponse,
  ImplementationLocation,
  NumberSchema,
  ObjectSchema,
  Parameter,
  Property,
  SchemaResponse,
  SchemaType,
  Schemas,
  Security,
  StringSchema,
  VirtualParameter,
} from "../src/common/codemodel.js";
import { Operation, Request } from "../src/common/operation.js";
import { ChoiceSchema } from "../src/common/schemas/choice.js";
import { ConstantSchema, ConstantValue } from "../src/common/schemas/constant.js";
import { createResponseErrorSchema } from "../src/external-schemas.js";
import { cloneOperationParameter } from "../src/operation-utils.js";

describe("code model characterization", () => {
  it("merges initialized containers without cloning model references", () => {
    class Holder extends Initializer {
      settings = { name: "default", nested: { enabled: true } };
      references: object[] = [];
      applyOptions(options: object) {
        this.apply(options);
      }
      exclude(options: object) {
        this.applyWithExclusions(["settings"], options);
      }
    }
    const holder = new Holder();
    const settings = holder.settings;
    const nested = settings.nested;
    const reference = { id: "model" };
    holder.applyOptions({ settings: { nested: { enabled: false } }, references: [reference] });
    expect(holder.settings).toBe(settings);
    expect(holder.settings.name).toBe("default");
    expect(holder.settings.nested).toBe(nested);
    expect(nested.enabled).toBe(false);
    expect(holder.references[0]).toBe(reference);
    holder.exclude({ settings: { name: "ignored" } });
    expect(holder.settings.name).toBe("default");
    const circular: { settings?: object } = {};
    circular.settings = circular;
    expect(() => holder.applyOptions(circular)).toThrow(
      "Circular refrenced models are not permitted in apply() initializers.",
    );
  });

  it("retains class identity, metadata defaults and schema references", () => {
    const schema = new StringSchema("string", "A string");
    const property = new Property("value", "A value", schema, {
      language: { default: { namespace: "test" }, java: { name: "javaValue" } },
      required: false,
    });
    expect(property).toBeInstanceOf(Property);
    expect(property.schema).toBe(schema);
    expect(property.language).toEqual({
      default: { name: "value", description: "A value", namespace: "test" },
      java: { name: "javaValue" },
    });
    expect(property.protocol).toEqual({});
    expect(property.serializedName).toBe("value");
    expect(new Security(false)).toEqual({ authenticationRequired: false, schemes: [] });
    expect(new BinaryResponse().binary).toBe(true);
    expect(new SchemaResponse(schema).schema).toBe(schema);
  });

  it("preserves schema registration and the Java-specific class distinction", () => {
    const schemas = new Schemas();
    const string = schemas.add(new StringSchema("string", ""));
    expect(schemas.add(new StringSchema("string", ""))).toBe(string);
    expect(schemas.add(new AnySchema("first"))).toBe(schemas.add(new AnySchema("second")));
    const integer = schemas.add(new NumberSchema("int", "", SchemaType.Integer, 32));
    expect(schemas.numbers).toEqual([integer]);
    const constant = () =>
      new ConstantSchema("value", "", { valueType: string, value: new ConstantValue("value") });
    expect(schemas.add(constant())).not.toBe(schemas.add(constant()));
    const choice = () => new ChoiceSchema("choice", "", { choiceType: string, choices: [] });
    expect(schemas.add(choice())).not.toBe(schemas.add(choice()));
    const object = schemas.add(new ObjectSchema("object", ""));
    expect(() => schemas.add(object)).toThrow("Duplicate !");
  });

  it("retains defaults overridden with undefined and does not deduplicate cyclic schemas", () => {
    const value = new StringSchema("string", "", {
      language: { default: { description: undefined } },
    });
    expect(value.language.default.description).toBeUndefined();
    const object = new ObjectSchema("recursive", "");
    const array = new ArraySchema("recursive", "", object);
    object.addProperty(new Property("children", "", array));
    const schemas = new Schemas();
    schemas.add(array);
    expect(() => schemas.add(array)).toThrow("Duplicate !");
    const other = new ArraySchema("recursive", "", object);
    expect(schemas.add(other)).toBe(other);
  });

  it("preserves recursive schemas, virtual parameters and YAML aliases", () => {
    const schemas = new Schemas();
    const error = createResponseErrorSchema(schemas, new StringSchema("string", ""));
    const decoded = parse(stringify({ schemas, error }, { version: "1.1" }));
    expect(decoded.error).toBe(decoded.schemas.objects[0]);
    expect(decoded.schemas.objects[1].properties[1].schema).toBe(decoded.schemas.objects[1]);
    const array = new ArraySchema("recursive", "", error);
    expect(schemas.add(array)).toBe(array);
    const parameter = new Parameter("body", "", error);
    const virtual = new VirtualParameter("code", "", error.properties![0].schema, {
      originalParameter: parameter,
      targetProperty: error.properties![0],
    });
    expect(virtual).toBeInstanceOf(VirtualParameter);
    expect(virtual.originalParameter).toBe(parameter);
    expect(virtual.targetProperty).toBe(error.properties![0]);
    const clone = cloneOperationParameter(virtual);
    expect(clone).toBeInstanceOf(Parameter);
    expect(clone).not.toBeInstanceOf(VirtualParameter);
    expect(clone.schema).toBe(virtual.schema);
  });

  it("preserves signature filtering and global-parameter ordering", () => {
    const string = new StringSchema("string", "");
    const visible = new Parameter("visible", "", string);
    const client = new Parameter("client", "", string, {
      implementation: ImplementationLocation.Client,
    });
    const grouped = new Parameter("grouped", "", string, { groupedBy: client });
    const flattened = new Parameter("flattened", "", string, { flattened: true });
    const constant = new Parameter(
      "constant",
      "",
      new ConstantSchema("constant", "", { valueType: string, value: new ConstantValue("x") }),
    );
    for (const target of [new Request(), new Operation("get", "")]) {
      for (const parameter of [visible, client, grouped, flattened, constant]) {
        target.addParameter(parameter);
      }
      expect(target.signatureParameters).toEqual([visible]);
    }
    const model = new CodeModel("test");
    model.addGlobalParameter(visible);
    model.addGlobalParameter(client);
    const priority = new Parameter("priority", "", string, { extensions: { "x-ms-priority": 1 } });
    model.addGlobalParameter(priority);
    expect(model.globalParameters).toEqual([priority, visible, client]);
  });

  it("preserves parent/subclient identity and YAML 1.1 strings", () => {
    const parent = new Client("parent", "", { language: { java: { namespace: "test" } } });
    const child = new Client("child", "", { language: { java: {} } });
    parent.addSubClient(child, true, false);
    expect(child.parent).toBe(parent);
    expect(child.language.java!.namespace).toBe("test");
    const decoded = parse(
      stringify({ parent, strings: ["2025-01-02", "yes", "no", "1:20"] }, { version: "1.1" }),
      { version: "1.1" },
    );
    expect(decoded.parent.subClients[0].parent).toBe(decoded.parent);
    expect(decoded.strings).toEqual(["2025-01-02", "yes", "no", "1:20"]);
  });

  it.each(["standard", "azure"])("builds an unchanged %s model from TypeSpec", async (flavor) => {
    const program = await compile(
      NodeHost,
      fileURLToPath(new URL("./fixtures/code-model.tsp", import.meta.url)),
      { noEmit: true },
    );
    expect(program.diagnostics).toEqual([]);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { "dev-options": {}, ...(flavor === "azure" ? { flavor } : {}) },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(model).toBeInstanceOf(CodeModel);
    expect(model.schemas).toBeInstanceOf(Schemas);
    expect(stringify(sortGraph(model), { version: "1.1" })).toMatchSnapshot();
  });
});

it("does not depend on AutoRest model packages", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  expect(manifest.dependencies).not.toHaveProperty("@autorest/codemodel");
  expect(manifest.dependencies).not.toHaveProperty("@azure-tools/codegen");
});

function sortGraph(value: unknown, seen = new Map<object, unknown>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    seen.set(value, result);
    result.push(...value.map((item) => sortGraph(item, seen)));
    return result;
  }
  const result: Record<string, unknown> = {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
    result[key] = sortGraph(child, seen);
  }
  return result;
}
