import { NodeHost, compile } from "@typespec/compiler";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { CodeModelBuilder } from "../src/code-model-builder.js";
import { addSubClient, createClient } from "../src/common/client.js";
import { addGlobalParameter, createCodeModel } from "../src/common/code-model.js";
import { addParameter, createOperation, createRequest } from "../src/common/operation.js";
import { addSchema, createSchemas } from "../src/common/schemas.js";
import { createChoiceSchema } from "../src/common/schemas/choice.js";
import { createConstantSchema, createConstantValue } from "../src/common/schemas/constant.js";
import {
  ImplementationLocation,
  SchemaType,
  createAnySchema,
  createArraySchema,
  createBinaryResponse,
  createByteArraySchema,
  createDateTimeSchema,
  createGroupProperty,
  createKeySecurityScheme,
  createNumberSchema,
  createObjectSchema,
  createParameter,
  createProperty,
  createSchemaResponse,
  createSecurity,
  createStringSchema,
  createVirtualParameter,
} from "../src/common/schemas/model.js";
import { createResponseErrorSchema } from "../src/external-schemas.js";
import { cloneOperationParameter } from "../src/operation-utils.js";

describe("code model characterization", () => {
  it("preserves metadata defaults and supplied schema references", () => {
    const schema = createStringSchema("string", "A string");
    const property = createProperty("value", "A value", schema, {
      language: { default: { namespace: "test" }, java: { name: "javaValue" } },
      required: false,
    });

    expect(property.schema).toBe(schema);
    expect(property.language).toEqual({
      default: { name: "value", description: "A value", namespace: "test" },
      java: { name: "javaValue" },
    });
    expect(property.protocol).toEqual({});
    expect(property.serializedName).toBe("value");
    expect(createSecurity(false)).toEqual({ authenticationRequired: false, schemes: [] });
    expect(createBinaryResponse().binary).toBe(true);
    expect(createSchemaResponse(schema).schema).toBe(schema);
  });

  it("preserves security container copies while sharing scheme objects", () => {
    const scheme = createKeySecurityScheme({ name: "api-key" });
    const schemes = [scheme];
    const security = createSecurity(true, { schemes });
    const client = createClient("client", "", { security });
    expect(security.schemes).not.toBe(schemes);
    expect(client.security).not.toBe(security);
    expect(client.security.schemes).not.toBe(security.schemes);
    expect(client.security.schemes[0]).toBe(scheme);
  });

  it("keeps wire collection names and primitive naming defaults", () => {
    const schemas = createSchemas();
    const bytes = addSchema(schemas, createByteArraySchema("bytes", "", { format: "byte" }));
    const date = addSchema(schemas, createDateTimeSchema("date", "", { format: "date-time" }));
    expect(schemas.byteArrays).toEqual([bytes]);
    expect(schemas.dateTimes).toEqual([date]);
    expect(createStringSchema("generated\u00b7string", "").language.default.name).toBe("string");
    expect(createAnySchema("Description").language.default).toEqual({
      name: "any",
      description: "Description",
    });
  });

  it("registers schemas without changing deduplication eligibility", () => {
    const schemas = createSchemas();
    const string = addSchema(schemas, createStringSchema("string", ""));
    expect(addSchema(schemas, createStringSchema("string", ""))).toBe(string);
    expect(addSchema(schemas, createAnySchema("first"))).toBe(
      addSchema(schemas, createAnySchema("second")),
    );
    const integer = addSchema(schemas, createNumberSchema("int", "", SchemaType.Integer, 32));
    expect(schemas.numbers).toEqual([integer]);
    const constant = () =>
      createConstantSchema("value", "", { valueType: string, value: createConstantValue("value") });
    expect(addSchema(schemas, constant())).not.toBe(addSchema(schemas, constant()));
    const choice = () => createChoiceSchema("choice", "", { choiceType: string, choices: [] });
    expect(addSchema(schemas, choice())).not.toBe(addSchema(schemas, choice()));
    const object = addSchema(schemas, createObjectSchema("object", ""));
    expect(() => addSchema(schemas, object)).toThrow("Duplicate !");
    schemas.any = [];
    const any = createAnySchema("empty collection");
    expect(addSchema(schemas, any)).toBe(any);
  });

  it("does not deduplicate cyclic or bigint-containing schemas", () => {
    const schemas = createSchemas();
    const object = createObjectSchema("recursive", "");
    const array = createArraySchema("recursive", "", object);
    object.properties = [createProperty("children", "", array)];
    addSchema(schemas, array);
    expect(() => addSchema(schemas, array)).toThrow("Duplicate !");
    const first = createStringSchema("bigint", "", { example: 1n });
    const second = createStringSchema("bigint", "", { example: 1n });
    expect(addSchema(schemas, first)).toBe(first);
    expect(addSchema(schemas, second)).toBe(second);
  });
  it("preserves recursive schemas, parameter references and YAML aliases", () => {
    const schemas = createSchemas();
    const error = createResponseErrorSchema(schemas, createStringSchema("string", ""));
    const inner = error.properties!.find((p) => p.serializedName === "innererror")!.schema;
    const yaml = stringify({ schemas, error }, { version: "1.1" });
    const decoded = parse(yaml);
    expect(decoded.error).toBe(decoded.schemas.objects[0]);
    expect(decoded.schemas.objects[1].properties[1].schema).toBe(decoded.schemas.objects[1]);
    const array = createArraySchema("recursive", "", error);
    expect(addSchema(schemas, array)).toBe(array);
    expect(inner).toBe(schemas.objects![1]);
    const parameter = createParameter("body", "", error);
    const originalParameters = [parameter];
    const groupProperty = createGroupProperty("body", "", error, {
      originalParameter: originalParameters,
    });
    expect(groupProperty.originalParameter).not.toBe(originalParameters);
    expect(groupProperty.originalParameter[0]).toBe(parameter);
    const virtual = createVirtualParameter("code", "", error.properties![0].schema, {
      originalParameter: parameter,
      targetProperty: error.properties![0],
    });
    expect(virtual.originalParameter).toBe(parameter);
    expect(virtual.targetProperty).toBe(error.properties![0]);
    expect(cloneOperationParameter(virtual).schema).toBe(virtual.schema);
    expect(cloneOperationParameter(virtual)).not.toHaveProperty("originalParameter");
  });
  it("filters signatures and sorts global parameters", () => {
    const string = createStringSchema("string", "");
    const visible = createParameter("visible", "", string);
    const client = createParameter("client", "", string, {
      implementation: ImplementationLocation.Client,
    });
    const grouped = createParameter("grouped", "", string, { groupedBy: client });
    const flattened = createParameter("flattened", "", string, { flattened: true });
    const constant = createParameter(
      "constant",
      "",
      createConstantSchema("constant", "", { valueType: string, value: createConstantValue("x") }),
    );
    for (const target of [createRequest(), createOperation("get", "")]) {
      for (const parameter of [visible, client, grouped, flattened, constant]) {
        addParameter(target, parameter);
      }
      expect(target.signatureParameters).toEqual([visible]);
    }
    const model = createCodeModel("test");
    addGlobalParameter(model, visible);
    addGlobalParameter(model, client);
    const priority = createParameter("priority", "", string, {
      extensions: { "x-ms-priority": 1 },
    });
    addGlobalParameter(model, priority);
    expect(model.globalParameters).toEqual([priority, visible, client]);
  });
  it("preserves parent/subclient references and scalar strings", () => {
    const parent = createClient("parent", "", { language: { java: { namespace: "test" } } });
    const child = createClient("child", "", { language: { java: {} } });
    addSubClient(parent, child, true, false);
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
    assertPlainGraph(model);
    expect(stringify(sortGraph(model), { version: "1.1" })).toMatchSnapshot();
  });

  it.each(["lro", "subclient", "multipart", "xml-bytes-verify"])(
    "builds %s metadata as plain data",
    async (scenario) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(
          new URL(
            `../../generator/http-client-generator-test/tsp/${scenario}.tsp`,
            import.meta.url,
          ),
        ),
        { noEmit: true },
      );
      expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      const options = { "dev-options": {}, "enable-subclient": scenario === "subclient" };
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options,
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(model.clients.length).toBeGreaterThan(0);
      assertPlainGraph(model);
      if (scenario === "lro") {
        expect(
          model.clients.some((client) =>
            client.operationGroups.some((group) =>
              group.operations?.some((op) => op.lroMetadata?.longRunning),
            ),
          ),
        ).toBe(true);
      } else if (scenario === "subclient") {
        expect(model.clients.some((client) => client.subClients.length > 0)).toBe(true);
      }
    },
  );
});

function assertPlainGraph(value: unknown, seen = new Set<object>()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.getPrototypeOf(value)).toBe(
    Array.isArray(value) ? Array.prototype : Object.prototype,
  );
  for (const child of Object.values(value)) {
    expect(typeof child).not.toBe("function");
    assertPlainGraph(child, seen);
  }
}

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
it("represents model nodes as plain data", () => {
  expect(Object.getPrototypeOf(createObjectSchema("model", ""))).toBe(Object.prototype);
});
