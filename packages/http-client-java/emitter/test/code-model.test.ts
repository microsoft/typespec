import { NodeHost, compile } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";
import { assert, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { CodeModelBuilder } from "../src/code-model-builder.js";
import type { PageableContinuationToken } from "../src/common/client.js";
import { addSubClient, createClient } from "../src/common/client.js";
import { addGlobalParameter, createCodeModel } from "../src/common/code-model.js";
import {
  addParameter,
  createOperation,
  createOperationGroup,
  createRequest,
} from "../src/common/operation.js";
import { addSchema, createSchemas } from "../src/common/schemas.js";
import { createChoiceSchema } from "../src/common/schemas/choice.js";
import { createConstantSchema, createConstantValue } from "../src/common/schemas/constant.js";
import {
  ImplementationLocation,
  KnownMediaType,
  ParameterLocation,
  SchemaType,
  createAnySchema,
  createArraySchema,
  createBinaryResponse,
  createByteArraySchema,
  createDateTimeSchema,
  createDiscriminator,
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
  isSchemaResponse,
} from "../src/common/schemas/model.js";
import { SchemaContext } from "../src/common/schemas/usage.js";
import { createResponseErrorSchema } from "../src/external-schemas.js";
import { cloneOperationParameter } from "../src/operation-utils.js";

describe("code model characterization", () => {
  it("generates SSE metadata for direct scalar payloads", async () => {
    const program = await compile(
      NodeHost,
      fileURLToPath(new URL("./fixtures/sse.tsp", import.meta.url)),
      { noEmit: true },
    );
    expectDiagnosticEmpty(program.diagnostics);

    const codeModel = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: {
        flavor: "azure",
      } as any,
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();

    expectDiagnosticEmpty(
      program.diagnostics.filter(
        (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
      ),
    );
    const operation = codeModel.clients
      .flatMap((client) => client.operationGroups)
      .flatMap((group) => group.operations ?? [])
      .find((operation) => operation.language.default.name === "scalarEvents")!;
    expect(operation.sseMetadata?.events).toMatchObject([
      { name: "first", payload: { type: SchemaType.String } },
      { name: "second", payload: { type: SchemaType.String } },
    ]);
    expect(operation.responses?.[0]).toMatchObject({ binary: true });
  });

  it("generates SSE metadata for recursive dictionary payloads", async () => {
    const program = await compile(
      NodeHost,
      fileURLToPath(new URL("./fixtures/sse.tsp", import.meta.url)),
      { noEmit: true },
    );
    expectDiagnosticEmpty(program.diagnostics);

    const codeModel = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: {
        flavor: "azure",
      } as any,
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();

    expectDiagnosticEmpty(
      program.diagnostics.filter(
        (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
      ),
    );
    const operation = codeModel.clients
      .flatMap((client) => client.operationGroups)
      .flatMap((group) => group.operations ?? [])
      .find((operation) => operation.language.default.name === "recursiveDictionaryEvents")!;
    expect(operation.sseMetadata?.events).toMatchObject([
      {
        name: "direct",
        payload: { type: SchemaType.Dictionary, elementType: { type: SchemaType.String } },
      },
      {
        name: "array",
        payload: {
          type: SchemaType.Array,
          elementType: {
            type: SchemaType.Dictionary,
            elementType: { type: SchemaType.String },
          },
        },
      },
      {
        name: "nested",
        payload: {
          type: SchemaType.Dictionary,
          elementType: {
            type: SchemaType.Dictionary,
            elementType: {
              type: SchemaType.Array,
              elementType: { type: SchemaType.String },
            },
          },
        },
      },
      {
        name: "modelMap",
        payload: {
          type: SchemaType.Dictionary,
          elementType: { type: SchemaType.Object },
        },
      },
    ]);
    expect(operation.responses?.[0]).toMatchObject({ binary: true });
  });

  it("generates supported Azure v1 SSE metadata without developer options", async () => {
    const program = await compile(
      NodeHost,
      fileURLToPath(new URL("./fixtures/sse.tsp", import.meta.url)),
      { noEmit: true },
    );
    expectDiagnosticEmpty(program.diagnostics);

    const build = async (flavor: string) =>
      new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor,
        } as any,
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();

    for (const flavor of ["standard", "azurev2"]) {
      const operations = (await build(flavor)).clients[0].operationGroups[0].operations!;
      for (const operation of operations) {
        expect(operation.sseMetadata).toBeUndefined();
        expect(operation.responses?.[0]).toMatchObject({ binary: true });
      }
    }
    expectDiagnosticEmpty(
      program.diagnostics.filter(
        (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
      ),
    );

    const enabledOperations = (await build("azure")).clients[0].operationGroups[0].operations!;
    const enabledOperation = enabledOperations.find(
      (operation) => operation.language.default.name === "retrieve",
    )!;
    expect(enabledOperation.generateProtocolApi).toBe(true);
    expect(enabledOperation.sseMetadata).toMatchObject({
      streamName: "RetrievalStreamEvents",
      modelNamespace: "ssetest.retrieve",
      events: [
        {
          name: "retrieval.started",
          terminal: false,
          payload: {
            language: { default: { name: "RetrievalStarted" } },
          },
        },
        {
          name: "response.completed",
          terminal: true,
          payload: {
            language: { default: { name: "ResponseCompleted" } },
          },
        },
      ],
    });

    const protocolOnlyOperation = enabledOperations.find(
      (operation) => operation.language.default.name === "retrieveProtocol",
    )!;
    expect(protocolOnlyOperation.sseMetadata).toBeDefined();
    expect(protocolOnlyOperation.convenienceApi).toBeUndefined();
    expect(protocolOnlyOperation.generateProtocolApi).toBe(true);
    expect(protocolOnlyOperation.responses?.[0]).toMatchObject({ binary: true });

    const jacksonOperations = (
      await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor: "azure",
          "stream-style-serialization": false,
        } as any,
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build()
    ).clients[0].operationGroups[0].operations!;
    const jacksonOperation = jacksonOperations.find(
      (operation) => operation.language.default.name === "retrieve",
    )!;
    expect(jacksonOperation.sseMetadata).toBeUndefined();
    expect(jacksonOperation.responses?.[0]).toMatchObject({ binary: true });
    expectDiagnostics(
      program.diagnostics.filter(
        (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
      ),
      jacksonOperations.map(() => ({
        code: "@typespec/http-client-java/sse-unsupported",
        severity: "warning",
      })),
    );
  });

  it.each(["azure", "standard"] as const)(
    "propagates %s usage to tagged descendants through an untagged intermediate",
    async (flavor) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/code-model.tsp", import.meta.url)),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const builder = new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor, "dev-options": {} },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      });
      const discriminator = createDiscriminator(
        createProperty("kind", "", createStringSchema("string", "")),
      );
      const usage = [SchemaContext.Input, SchemaContext.Output, SchemaContext.Public];
      const root = createObjectSchema("PetBase", "", {
        discriminator,
        usage,
        serializationFormats: [KnownMediaType.Json],
      });
      const intermediate = createObjectSchema("Mammal", "", {
        parents: { immediate: [root], all: [root] },
      });
      const cat = createObjectSchema("Cat", "", {
        discriminatorValue: "cat",
        parents: { immediate: [intermediate], all: [intermediate, root] },
      });
      const unused = createObjectSchema("Unused", "", {
        parents: { immediate: [intermediate], all: [intermediate, root] },
      });
      root.children = { immediate: [intermediate], all: [intermediate, cat, unused] };
      intermediate.children = { immediate: [cat, unused], all: [cat, unused] };
      discriminator.all.cat = cat;

      builder["propagateSchemaUsage"](root);

      for (const schema of [intermediate, cat]) {
        expect(schema.usage).toEqual(expect.arrayContaining(usage));
        expect(schema.serializationFormats).toEqual([KnownMediaType.Json]);
      }
      expect(unused.usage).toBeUndefined();
      expect(unused.serializationFormats).toBeUndefined();
    },
  );

  it.each(["azure", "standard"] as const)(
    "reads continuation-token visibility from the request parameter for %s",
    async (flavor) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/continuation-token.tsp", import.meta.url)),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor, "dev-options": {} },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expectDiagnosticEmpty(program.diagnostics);
      const operations = model.clients.flatMap((client) =>
        client.operationGroups.flatMap((group) => group.operations ?? []),
      );
      expect(operations).toHaveLength(4);
      for (const operation of operations) {
        const name = operation.language.default.name;
        const pageable = operation.extensions?.["x-ms-pageable"] as
          { continuationToken?: PageableContinuationToken; nextLinkName?: string } | undefined;
        assert.isDefined(pageable?.continuationToken);
        const token = pageable.continuationToken;
        expect(token.includeContinuationTokenParameter).toBe(
          name === "queryBody" || name === "headerHeader",
        );
        expect(token.parameter).toBe(
          operation.parameters?.find((p) => p.language.default.serializedName === "token"),
        );
        expect(token.parameter.protocol.http?.in).toBe(
          name.startsWith("query") ? "query" : "header",
        );
        expect(pageable.nextLinkName).toBeUndefined();
        if (name.endsWith("Header")) {
          expect(token.responseHeader?.header).toBe("next-token");
          expect(token.responseProperty).toBeUndefined();
        } else {
          expect(token.responseProperty?.map((p) => p.serializedName)).toEqual(
            name === "queryBody" ? ["next", "token"] : ["nextToken"],
          );
          expect(token.responseHeader).toBeUndefined();
        }
      }
    },
  );

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

  it("preserves root model container copies while sharing model nodes", () => {
    const schema = createStringSchema("string", "");
    const schemas = { strings: [schema] };
    const scheme = createKeySecurityScheme({ name: "api-key" });
    const security = createSecurity(true, { schemes: [scheme] });
    const group = createOperationGroup("group");
    const operationGroups = [group];
    const client = createClient("client", "");
    const clients = [client];
    const model = createCodeModel("test", { schemas, security, operationGroups, clients });

    expect(model.schemas).not.toBe(schemas);
    expect(model.schemas.strings).toBe(schemas.strings);
    expect(model.schemas.strings![0]).toBe(schema);
    expect(model.security).not.toBe(security);
    expect(model.security.authenticationRequired).toBe(true);
    expect(model.security.schemes).not.toBe(security.schemes);
    expect(model.security.schemes[0]).toBe(scheme);
    expect(model.operationGroups).not.toBe(operationGroups);
    expect(model.operationGroups[0]).toBe(group);
    expect(model.clients).not.toBe(clients);
    expect(model.clients[0]).toBe(client);

    schemas.strings = [];
    security.authenticationRequired = false;
    security.schemes.push(createKeySecurityScheme({ name: "other-key" }));
    operationGroups.push(createOperationGroup("other-group"));
    clients.push(createClient("other-client", ""));
    expect(model.schemas.strings).toEqual([schema]);
    expect(model.security).toEqual({ authenticationRequired: true, schemes: [scheme] });
    expect(model.operationGroups).toEqual([group]);
    expect(model.clients).toEqual([client]);
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
    const animal = model.schemas.objects!.find(
      (schema) => schema.language.default.name === "Animal",
    )!;
    const cat = model.schemas.objects!.find((schema) => schema.language.default.name === "Cat")!;
    expect(animal.discriminator!.all.cat).toBe(cat);
    assertPlainGraph(model);
    expect(stringify(sortGraph(model), { version: "1.1" })).toMatchSnapshot();
  });

  it.each(["lro", "subclient", "multipart", "xml-bytes-verify"])(
    "preserves %s YAML metadata and references",
    async (scenario) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(
          new URL(
            scenario === "xml-bytes-verify"
              ? "./fixtures/xml-bytes.tsp"
              : `../../generator/http-client-generator-test/tsp/${scenario}.tsp`,
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
      expect(stringify(sortGraph(model), { version: "1.1" })).toMatchSnapshot();
    },
  );

  it.each(["standard", "azure", "azurev2"])(
    "honors response replacements in %s clients",
    async (flavor) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/response-replacement.tsp", import.meta.url)),
        { noEmit: true },
      );
      expect(program.diagnostics).toEqual([]);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { "dev-options": {}, flavor },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expectDiagnostics(
        program.diagnostics.filter(
          (diagnostic) =>
            diagnostic.code !==
            "@azure-tools/typespec-client-generator-core/unsupported-generic-decorator-arg-type",
        ),
        [
          {
            code: "@typespec/http-client-java/bytes-response-replacement-without-body",
            severity: "warning",
            message:
              "Cannot replace the response of operation 'bodylessBytesResponse' with bytes: the emitter cannot fabricate bytes when the HTTP response has no body. The response type override is ignored.",
          },
        ],
      );
      const operations = model.clients.flatMap((client) =>
        client.operationGroups.flatMap((group) => group.operations ?? []),
      );
      const voidOperation = operations.find((op) => op.language.default.name === "voidResponse")!;
      const bytesOperation = operations.find((op) => op.language.default.name === "bytesResponse")!;
      const widgetOperation = operations.find(
        (op) => op.language.default.name === "widgetResponse",
      )!;
      for (const operation of [voidOperation, bytesOperation]) {
        expect(operation.responses).toHaveLength(1);
        expect(operation.responses![0].protocol.http).toMatchObject({
          statusCodes: ["200"],
          headers: [expect.objectContaining({ header: "x-response-id" })],
        });
        if (operation === voidOperation && flavor !== "azure") {
          expect(operation.responses![0].protocol.http).not.toHaveProperty("mediaTypes");
        } else {
          expect(operation.responses![0].protocol.http?.mediaTypes).toEqual(["application/json"]);
        }
        expect(operation.exceptions).toHaveLength(1);
        expect(operation.exceptions![0].protocol.http?.statusCodes).toEqual(["400"]);
        expect(isSchemaResponse(operation.exceptions![0])).toBe(true);
        expect(operation.exceptions![0]).toMatchObject({
          schema: {
            usage: expect.arrayContaining(
              flavor === "standard" ? ["exception", "public"] : ["exception"],
            ),
          },
        });
      }
      if (flavor === "azure") {
        expect(voidOperation.convenienceApi).toHaveProperty("response");
        expect(voidOperation.convenienceApi).toMatchObject({ response: {} });
        expect(bytesOperation.convenienceApi).toMatchObject({ response: { binary: true } });
        expect(isSchemaResponse(voidOperation.responses![0])).toBe(true);
        expect(isSchemaResponse(bytesOperation.responses![0])).toBe(true);
      } else {
        expect(isSchemaResponse(voidOperation.responses![0])).toBe(false);
        expect(voidOperation.responses![0]).not.toHaveProperty("binary");
        expect(bytesOperation.responses![0]).toMatchObject({ binary: true });
      }
      expect(widgetOperation.convenienceApi).not.toHaveProperty("response");
      expect(widgetOperation.responses![0]).toMatchObject({
        schema: { type: SchemaType.Object, language: { default: { name: "Widget" } } },
      });
      const encodedBytesOperation = operations.find(
        (op) => op.language.default.name === "encodedBytesResponse",
      )!;
      expect(
        flavor === "azure"
          ? encodedBytesOperation.convenienceApi
          : { response: encodedBytesOperation.responses![0] },
      ).toMatchObject({ response: { binary: true } });
      const parameterOverrideOperation = operations.find(
        (op) => op.language.default.name === "parameterOverrideBytesResponse",
      )!;
      expect(parameterOverrideOperation.convenienceApi).not.toHaveProperty("response");
      expect(parameterOverrideOperation.responses![0]).toMatchObject({
        schema: { type: SchemaType.ByteArray },
      });
      const parameterOverrideOptionalOperation = operations.find(
        (op) => op.language.default.name === "parameterOverrideOptionalBytesResponse",
      )!;
      expect(parameterOverrideOptionalOperation.convenienceApi).not.toHaveProperty("response");
      expect(parameterOverrideOptionalOperation.responses![0]).toMatchObject({
        schema: { type: SchemaType.ByteArray },
      });
      expect(parameterOverrideOptionalOperation.responses![1]).not.toHaveProperty("schema");
      expect(parameterOverrideOptionalOperation.responses![1]).not.toHaveProperty("binary");

      const optionalBytesOperation = operations.find(
        (op) => op.language.default.name === "optionalBytesResponse",
      )!;
      const optionalVoidOperation = operations.find(
        (op) => op.language.default.name === "optionalVoidResponse",
      )!;
      if (flavor === "azure") {
        expect(optionalBytesOperation.convenienceApi).toMatchObject({ response: { binary: true } });
        expect(optionalVoidOperation.convenienceApi).toMatchObject({ response: {} });
        expect(isSchemaResponse(optionalVoidOperation.responses![0])).toBe(true);
      } else {
        expect(optionalBytesOperation.responses![0]).toMatchObject({ binary: true });
        expect(optionalVoidOperation.responses![0]).not.toHaveProperty("schema");
      }
      for (const name of ["bodylessBytesResponse", "suppressedBodylessBytesResponse"]) {
        const operation = operations.find((op) => op.language.default.name === name)!;
        expect(operation.convenienceApi).not.toHaveProperty("response");
        expect(operation.responses![0]).not.toHaveProperty("schema");
        expect(operation.responses![0]).not.toHaveProperty("binary");
        expect(operation.responses![0].protocol.http).toMatchObject({
          statusCodes: ["204"],
          headers: [expect.objectContaining({ header: "x-response-id" })],
        });
      }
      const bodylessOperation = operations.find(
        (op) => op.language.default.name === "bodylessBytesResponse",
      )!;
      expect(bodylessOperation.exceptions![0]).toMatchObject({
        schema: { usage: expect.arrayContaining(["exception"]) },
      });
    },
  );
  it.each([
    { internalApi: false, typedHeaders: false },
    { internalApi: false, typedHeaders: true },
    { internalApi: true, typedHeaders: false },
    { internalApi: true, typedHeaders: true },
  ])(
    "preserves replacement header visibility (internal: $internalApi, typed: $typedHeaders)",
    async ({ internalApi, typedHeaders }) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(
          new URL(
            `./fixtures/response-replacement-headers${internalApi ? "-internal" : ""}.tsp`,
            import.meta.url,
          ),
        ),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor: "azure",
          ...(typedHeaders ? { "max-overload": "model" } : {}),
          "dev-options": {},
        },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expectDiagnosticEmpty(
        program.diagnostics.filter(
          (diagnostic) =>
            diagnostic.code !==
            "@azure-tools/typespec-client-generator-core/unsupported-generic-decorator-arg-type",
        ),
      );
      const bodySchema = model.schemas.objects?.find(
        (schema) => schema.language.default.name === "OriginalBody",
      );
      const bodyEnum = [
        ...(model.schemas.choices ?? []),
        ...(model.schemas.sealedChoices ?? []),
      ].find((schema) => schema.language.default.name === "BodyState");
      for (const schema of [bodySchema, bodyEnum]) {
        expect(schema).toBeDefined();
        for (const visibility of ["public", "internal"]) {
          expect(schema).not.toMatchObject({ usage: expect.arrayContaining([visibility]) });
        }
      }

      const operations = model.clients.flatMap((client) =>
        client.operationGroups.flatMap((group) => group.operations ?? []),
      );
      expect(operations).toHaveLength(2);
      for (const operation of operations) {
        expect(operation.internalApi).toBe(internalApi);
        expect(operation.responses).toHaveLength(1);
        expect(operation.responses![0]).toMatchObject({ schema: bodySchema });
        const header = operation.responses![0].protocol.http?.headers?.[0];
        assert.isDefined(header);
        expect(header).toMatchObject({
          header: "x-response-state",
          schema: { language: { default: { name: "ResponseState" } } },
        });
        if (typedHeaders) {
          expect(header.schema).toMatchObject({
            usage: expect.arrayContaining([internalApi ? "internal" : "public"]),
          });
        } else {
          for (const visibility of ["public", "internal"]) {
            expect(header.schema).not.toMatchObject({
              usage: expect.arrayContaining([visibility]),
            });
          }
        }
      }
    },
  );

  it.each([
    { scenario: "arm-api-version-override", enableSubclient: false },
    { scenario: "arm-api-version-override", enableSubclient: true },
    { scenario: "arm-api-version-override-only", enableSubclient: false },
    { scenario: "api-version-header-override", enableSubclient: false },
    { scenario: "arm-versioned", enableSubclient: false },
    { scenario: "arm-versioned", enableSubclient: false, apiVersion: "2023-12-01" },
  ])(
    "preserves $scenario API versions (subclients: $enableSubclient, version: $apiVersion)",
    async ({ scenario, enableSubclient, apiVersion }) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(
          new URL(
            scenario === "arm-api-version-override-only" ||
              scenario === "api-version-header-override"
              ? `./fixtures/${scenario}.tsp`
              : `../../generator/http-client-generator-test/tsp/${scenario}.tsp`,
            import.meta.url,
          ),
        ),
        { noEmit: true },
      );
      expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor: "azure",
          "enable-subclient": enableSubclient,
          "api-version": apiVersion,
          "dev-options": {},
        },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expect(program.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      const clients = model.clients.filter((client) =>
        client.operationGroups.some((group) => group.operations?.length),
      );
      expect(clients).toHaveLength(enableSubclient ? 2 : 1);
      for (const client of clients) {
        expect(client.operationGroups).toHaveLength(
          scenario === "arm-api-version-override" && !enableSubclient ? 2 : 1,
        );
        for (const group of client.operationGroups) {
          expect(group.operations?.length).toBeGreaterThan(0);
          if (scenario === "api-version-header-override") {
            expect(group.operations).toHaveLength(2);
          }
          const groupName = enableSubclient ? client.language.default.name : group.$key;
          const overridden = scenario !== "arm-versioned" && groupName !== "NetworkInterfaces";
          for (const operation of group.operations ?? []) {
            const serializedName =
              operation.language.default.name === "readNamed" ? "x-ms-api-version" : "api-version";
            const parameter = operation.parameters?.find(
              (p) => p.language.default.serializedName === serializedName,
            );
            expect(parameter).toMatchObject({
              implementation:
                scenario !== "arm-versioned" && (!enableSubclient || overridden)
                  ? ImplementationLocation.Method
                  : ImplementationLocation.Client,
              protocol: {
                http: {
                  in:
                    scenario === "api-version-header-override"
                      ? ParameterLocation.Header
                      : ParameterLocation.Query,
                },
              },
              schema: {
                type: SchemaType.Constant,
                value: {
                  value:
                    scenario === "arm-versioned"
                      ? (apiVersion ?? "2024-12-01")
                      : overridden
                        ? "2018-10-01"
                        : "2026-03-01",
                },
              },
            });
          }
        }
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
