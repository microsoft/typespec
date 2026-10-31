import {
  NodeHost,
  compile,
  createSourceFile,
  resolvePath,
  type CompilerHost,
  type Type,
} from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";
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

const sseFixturePath = resolvePath(fileURLToPath(new URL("./fixtures/sse.tsp", import.meta.url)));

async function compileSseScenario(namespace: string, warningAsError = false) {
  const entrypoint = resolvePath(
    sseFixturePath.replace(/sse\.tsp$/, `sse-${namespace.toLowerCase()}.tsp`),
  );
  const sourceFile = createSourceFile(
    `import "./sse.tsp";\n@@service(${namespace});\n`,
    entrypoint,
  );
  const isEntrypoint = (path: string) => resolvePath(path) === entrypoint;
  const host: CompilerHost = {
    ...NodeHost,
    readFile: (path) =>
      isEntrypoint(path) ? Promise.resolve(sourceFile) : NodeHost.readFile(path),
    stat: (path) =>
      isEntrypoint(path)
        ? Promise.resolve({ isDirectory: () => false, isFile: () => true })
        : NodeHost.stat(path),
    realpath: (path) =>
      isEntrypoint(path) ? Promise.resolve(entrypoint) : NodeHost.realpath(path),
  };
  return compile(host, entrypoint, { noEmit: true, warningAsError });
}

describe("experimental metadata", () => {
  it.each(["azure", "azurev2"])(
    "preserves experimental properties introduced by %s grouped overrides",
    async (flavor) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/experimental-override.tsp", import.meta.url)),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor,
          "experimental-annotation": "com.example.Preview",
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
      const group = model.schemas.groups!.find(
        (schema) => schema.language.default.name === "OverrideOptions",
      )!;
      assert.isDefined(group);
      expect(
        group.properties!.find((property) => property.language.default.name === "preview")!
          .experimental,
      ).toEqual({ diagnosticId: "OVERRIDE_QUERY" });
      expect(
        group.properties!.find((property) => property.language.default.name === "original")!
          .experimental,
      ).toEqual({ diagnosticId: "ORIGINAL_QUERY" });
      expect(
        group.properties!.find((property) => property.language.default.name === "stable")!
          .experimental,
      ).toBeUndefined();
    },
  );

  it.each([
    { flavor: "azure", enabled: true, subclient: false },
    { flavor: "azurev2", enabled: true, subclient: false },
    { flavor: "generic", enabled: true, subclient: false },
    { flavor: undefined, enabled: true, subclient: false },
    { flavor: "azure", enabled: false, subclient: false },
    { flavor: "azurev2", enabled: false, subclient: false },
    { flavor: "generic", enabled: false, subclient: false },
    { flavor: "azure", enabled: true, subclient: true },
    { flavor: "azurev2", enabled: true, subclient: true },
    { flavor: "generic", enabled: true, subclient: true },
  ])(
    "only emits experimental markers for $flavor with annotation enabled=$enabled and subclient=$subclient",
    async ({ flavor, enabled, subclient }) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/experimental.tsp", import.meta.url)),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const namespace = program.getGlobalNamespaceType().namespaces.get("ExperimentalContract")!;
      const warnings = new Map<Type, string>([
        [namespace, "Client preview"],
        [namespace.interfaces.get("Group")!, "Group preview"],
        [namespace.operations.get("read")!, 'Operation "preview"\nwith a \\ path'],
        [namespace.models.get("Preview")!.properties.get("value")!, "Property preview"],
        [namespace.enums.get("Choice")!, "Enum preview"],
        [namespace.enums.get("Choice")!.members.get("One")!, "Enum value preview"],
        [namespace.models.get("EmptyWarning")!, ""],
      ]);
      // Ignore warning text even when supplied by a lifecycle metadata producer.
      for (const [target, warningText] of warnings) {
        const details = $(program).client.getFeatureLifecycleDetails(target, {
          emitterName: "@typespec/http-client-java",
        });
        assert.isDefined(details);
        Object.assign(details, { warningText });
      }
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor,
          "experimental-annotation": enabled ? "com.example.Preview" : undefined,
          "enable-subclient": subclient,
          "dev-options": {},
        },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
      expectDiagnosticEmpty(program.diagnostics);
      const expectedExperimental =
        enabled && ["azure", "azurev2"].includes(flavor ?? "") ? {} : undefined;

      const client = model.clients.find(
        (client) => client.language.default.name === "ExperimentalContractClient",
      )!;
      expect(client.experimental).toEqual(expectedExperimental);
      expect(client.language.java ?? {}).not.toHaveProperty("experimental");
      const group = client.operationGroups.find((group) => group.language.default.name === "Group");
      const child = client.subClients.find((client) => client.language.default.name === "Group");
      expect((child ?? group)!.experimental).toEqual(expectedExperimental);
      const operations = client.operationGroups.flatMap((group) => group.operations ?? []);
      const operation = operations.find((operation) => operation.operationId === "read")!;
      const expectedOperationExperimental = expectedExperimental && { diagnosticId: "PREVIEW001" };
      expect(operation.experimental).toEqual(expectedOperationExperimental);
      expect(parse(stringify(operation)).experimental).toEqual(expectedOperationExperimental);
      const parameterOperation = operations.find(
        (operation) => operation.operationId === "parameters",
      )!;
      expect(parameterOperation.experimental).toBeUndefined();
      const parameters = parameterOperation.parameters!;
      const previewQuery = parameters.find(
        (parameter) => parameter.language.default.name === "previewQuery",
      )!;
      const expectedQueryExperimental = expectedExperimental && { diagnosticId: "QUERY001" };
      expect(previewQuery.experimental).toEqual(expectedQueryExperimental);
      expect(parse(stringify(previewQuery)).experimental).toEqual(expectedQueryExperimental);
      expect(
        parameters.find((parameter) => parameter.language.default.name === "body")!.experimental,
      ).toEqual(expectedExperimental);
      expect(
        parameters.find((parameter) => parameter.language.default.name === "stableQuery")!
          .experimental,
      ).toBeUndefined();
      const groupOperations = child
        ? child.operationGroups.flatMap((group) => group.operations ?? [])
        : group!.operations;
      expect(groupOperations?.[0].experimental).toEqual(expectedExperimental);

      const preview = model.schemas.objects?.find(
        (schema) => schema.language.default.name === "Preview",
      )!;
      expect(preview.experimental).toEqual(expectedExperimental);
      assert.isDefined(preview.properties);
      expect(preview.properties[0].experimental).toEqual(expectedExperimental);
      const choice = model.schemas.sealedChoices?.find(
        (schema) => schema.language.default.name === "Choice",
      )!;
      expect(choice.experimental).toEqual(expectedExperimental);
      expect(choice.choices[0].experimental).toEqual(expectedExperimental);
      expect(choice.choices[1].experimental).toBeUndefined();
      const openChoice = model.schemas.choices?.find(
        (schema) => schema.language.default.name === "OpenChoice",
      )!;
      expect(openChoice.experimental).toEqual(expectedExperimental);
      expect(openChoice.choices[0].experimental).toEqual(expectedExperimental);
      for (const name of ["Stable", "Excluded"]) {
        const schema = model.schemas.objects?.find(
          (schema) => schema.language.default.name === name,
        )!;
        expect(schema.experimental).toBeUndefined();
      }
      const emptyWarning = model.schemas.objects?.find(
        (schema) => schema.language.default.name === "EmptyWarning",
      )!;
      expect(emptyWarning.experimental).toEqual(expectedExperimental);
      expect(parse(stringify(client)).experimental).toEqual(expectedExperimental);
    },
  );

  it("preserves experimental metadata and Java names when cloning parameters", () => {
    const parameter = createParameter("query", "", createStringSchema("string", ""), {
      experimental: { diagnosticId: "QUERY001" },
      language: { java: { name: "exactQuery" } },
    });
    const clone = cloneOperationParameter(parameter);
    expect(clone.experimental).toEqual({ diagnosticId: "QUERY001" });
    expect(clone.language.java?.name).toBe("exactQuery");
  });

  it.each(["azure", "azurev2"])(
    "preserves experimental metadata through %s parameter flattening and grouping",
    async (flavor) => {
      const program = await compile(
        NodeHost,
        fileURLToPath(new URL("./fixtures/experimental-flattening.tsp", import.meta.url)),
        { noEmit: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const model = await new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: {
          flavor,
          "experimental-annotation": "com.example.Preview",
          "dev-options": {},
        },
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
      const flattened = operations.find((operation) => operation.operationId === "flattened")!;
      const request = flattened.convenienceApi!.requests![0];
      expect(request.signatureParameters).toHaveLength(5);
      for (const [name, diagnosticId] of [
        ["previewQuery", "FLAT_QUERY"],
        ["previewHeader", "FLAT_HEADER"],
        ["previewPath", "FLAT_PATH"],
        ["previewBody", "FLAT_BODY"],
      ]) {
        const parameter = request.signatureParameters!.find(
          (parameter) => parameter.language.default.name === name,
        )!;
        expect(parameter.experimental).toEqual({ diagnosticId });
      }
      const grouped = operations.find((operation) => operation.operationId === "grouped")!;
      const groupedRequest = grouped.convenienceApi!.requests![0];
      expect(groupedRequest.signatureParameters).toHaveLength(1);
      const group = model.schemas.groups!.find(
        (schema) => schema === groupedRequest.signatureParameters![0].schema,
      )!;
      assert.isDefined(group);
      expect(
        group.properties!.find((property) => property.language.default.name === "previewQuery")!
          .experimental,
      ).toEqual({ diagnosticId: "GROUP_QUERY" });
      expect(
        group.properties!.find((property) => property.language.default.name === "previewBody")!
          .experimental,
      ).toEqual({ diagnosticId: "GROUP_BODY" });
      expect(
        group.properties!.find((property) => property.language.default.name === "previewOptional")!
          .experimental,
      ).toEqual({ diagnosticId: "GROUP_OPTIONAL" });
      expect(
        group.properties!.find((property) => property.language.default.name === "stableOne")!
          .experimental,
      ).toBeUndefined();
    },
  );
});

describe("code model characterization", () => {
  it.each(["SseGeneric", "SseGenericEncoded", "SseGenericReused"])(
    "checks effective generic union ownership: %s",
    async (namespace) => {
      const program = await compileSseScenario(namespace);
      expectDiagnosticEmpty(program.diagnostics);
      const builder = new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor: "azure" },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      });
      if (namespace === "SseGenericReused") {
        const model = await builder.build();
        const operations = model.clients
          .flatMap((client) => client.operationGroups)
          .flatMap((group) => group.operations ?? []);
        expect(operations.map((operation) => operation.sseMetadata?.sseStreamId)).toEqual([
          "SseGenericReused.GenericEvents",
          "SseGenericReused.GenericEvents",
        ]);
        expect(operations[0].sseMetadata).not.toBe(operations[1].sseMetadata);
        expect(operations[0].sseMetadata).toMatchObject(operations[1].sseMetadata!);
        expect(Object.keys(operations[0].sseMetadata!).sort()).toEqual([
          "baseSchema",
          "events",
          "sseStreamId",
          "streamName",
        ]);
        expect(operations[0].sseMetadata).not.toHaveProperty("owner");
        expect(operations[0].sseMetadata).not.toHaveProperty("schemas");
        expect(operations[0].sseMetadata?.baseSchema).toBe(operations[1].sseMetadata?.baseSchema);
        expect(operations[0].sseMetadata?.events).not.toBe(operations[1].sseMetadata?.events);
        expect(operations[0].sseMetadata?.events[0]).not.toBe(operations[1].sseMetadata?.events[0]);
        expect(operations[0].sseMetadata?.events[0].eventSchema).toBe(
          operations[1].sseMetadata?.events[0].eventSchema,
        );
        expect(model).not.toHaveProperty("sseStreams");
      } else {
        await expect(builder.build()).rejects.toThrow(
          "Distinct SSE unions claim cross-language definition ID",
        );
      }
    },
  );
  it.each(["SseGenericSupportedFirst", "SseGenericUnsupportedFirst"])(
    "falls back for unsupported generic SSE streams regardless of operation order: %s",
    async (namespace) => {
      const program = await compileSseScenario(namespace);
      expectDiagnosticEmpty(program.diagnostics);
      const builder = new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor: "azure" },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      });
      const model = await builder.build();
      const operations = Object.fromEntries(
        model.clients
          .flatMap((client) => client.operationGroups)
          .flatMap((group) => group.operations ?? [])
          .map((operation) => [operation.language.default.name, operation]),
      );

      expect(operations.unsupported.sseMetadata).toBeUndefined();
      expect(operations.unsupported.responses?.[0]).toMatchObject({ binary: true });
      expect(operations.supported.responses?.[0]).toMatchObject({ binary: true });
      expect(operations.supported.sseMetadata).toMatchObject({
        sseStreamId: `${namespace}.GenericEvents`,
        streamName: expect.stringMatching(/^GenericEvents\d*$/),
      });
      expect(
        operations.supported.sseMetadata?.events.find((event) => event.name === "value"),
      ).toMatchObject({
        eventSchema: {
          properties: [
            {
              serializedName: "value",
              schema: { type: SchemaType.String },
            },
          ],
        },
      });
      expectDiagnostics(
        program.diagnostics.filter(
          (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
        ),
        [
          {
            code: "@typespec/http-client-java/sse-unsupported",
            severity: "warning",
          },
        ],
      );
    },
  );
  it("creates registered wrappers only for explicitly named events with nonliteral JSON payloads", async () => {
    const program = await compileSseScenario("SseVariants");
    expectDiagnosticEmpty(program.diagnostics);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    const operations = model.clients
      .flatMap((client) => client.operationGroups)
      .flatMap((group) => group.operations ?? []);
    const namedOperation = operations.find(
      (operation) => operation.language.default.name === "named",
    )!;
    expect(namedOperation.sseMetadata).toMatchObject({
      sseStreamId: "SseVariants.Named",
      streamName: "Named",
      baseSchema: {
        type: SchemaType.Object,
        language: {
          default: { name: "NamedEvent" },
          java: { namespace: "ssevariants" },
        },
        properties: [
          {
            language: { default: { name: "eventName" } },
            serializedName: "eventName",
            required: true,
            readOnly: true,
            schema: { type: SchemaType.String },
          },
        ],
      },
      events: [
        {
          name: "message",
          eventSchema: {
            type: SchemaType.Object,
            properties: [{ schema: { type: SchemaType.String } }],
          },
          terminal: false,
        },
        {
          name: "count",
          eventSchema: {
            type: SchemaType.Object,
            properties: [{ schema: { type: SchemaType.Integer } }],
          },
          terminal: false,
        },
        {
          name: "enabled",
          eventSchema: {
            type: SchemaType.Object,
            properties: [{ schema: { type: SchemaType.Boolean } }],
          },
          terminal: false,
        },
        {
          name: "collections",
          eventSchema: {
            type: SchemaType.Object,
            properties: [
              {
                schema: {
                  type: SchemaType.Array,
                  elementType: {
                    type: SchemaType.Dictionary,
                    elementType: { type: SchemaType.Array },
                  },
                },
              },
            ],
          },
          terminal: false,
        },
        {
          name: "payloadModel",
          eventSchema: {
            type: SchemaType.Object,
            properties: [{ schema: { type: SchemaType.Object } }],
          },
          terminal: false,
        },
        {
          name: "done",
          eventSchema: {
            type: SchemaType.Object,
            properties: [{ schema: { type: SchemaType.Object } }],
          },
          terminal: true,
        },
      ],
    });

    const unsupportedOperations = [
      "unnamed",
      "mixed",
      "stringLiteral",
      "namedStringLiteral",
      "terminalLiteral",
      "numberLiteral",
      "namedNumberLiteral",
      "booleanLiteral",
      "namedBooleanLiteral",
      "unsupportedPayloadEncoding",
      "nullablePayload",
    ];
    for (const operationName of unsupportedOperations) {
      const operation = operations.find(
        (operation) => operation.language.default.name === operationName,
      )!;
      expect(operation.sseMetadata).toBeUndefined();
      expect(operation.responses?.[0]).toMatchObject({ binary: true });
    }
    expect(model).not.toHaveProperty("sseStreams");
    expectDiagnostics(
      program.diagnostics.filter(
        (diagnostic) => diagnostic.code === "@typespec/http-client-java/sse-unsupported",
      ),
      unsupportedOperations.map(() => ({
        code: "@typespec/http-client-java/sse-unsupported" as const,
        severity: "warning" as const,
      })),
    );
  });
  it("allows an unsupported SSE operation to suppress its fallback warning", async () => {
    const program = await compileSseScenario("SseSuppressedUnsupported", true);
    expectDiagnosticEmpty(program.diagnostics);

    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();

    expectDiagnosticEmpty(program.diagnostics);
    const operation = model.clients
      .flatMap((client) => client.operationGroups)
      .flatMap((group) => group.operations ?? [])
      .find((operation) => operation.language.default.name === "read")!;
    expect(operation.sseMetadata).toBeUndefined();
    expect(operation.responses?.[0]).toMatchObject({ binary: true });
  });
  it("generates SSE metadata for named scalar payloads", async () => {
    const program = await compileSseScenario("SseTest");
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
      {
        name: "first",
        eventSchema: { properties: [{ schema: { type: SchemaType.String } }] },
      },
      {
        name: "second",
        eventSchema: { properties: [{ schema: { type: SchemaType.String } }] },
      },
    ]);
    expect(operation.responses?.[0]).toMatchObject({ binary: true });
  });

  it("generates SSE metadata for recursive dictionary payloads", async () => {
    const program = await compileSseScenario("SseTest");
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
        eventSchema: {
          properties: [
            {
              schema: {
                type: SchemaType.Dictionary,
                elementType: { type: SchemaType.String },
              },
            },
          ],
        },
      },
      {
        name: "array",
        eventSchema: {
          properties: [
            {
              schema: {
                type: SchemaType.Array,
                elementType: {
                  type: SchemaType.Dictionary,
                  elementType: { type: SchemaType.String },
                },
              },
            },
          ],
        },
      },
      {
        name: "nested",
        eventSchema: {
          properties: [
            {
              schema: {
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
          ],
        },
      },
      {
        name: "modelMap",
        eventSchema: {
          properties: [
            {
              schema: {
                type: SchemaType.Dictionary,
                elementType: { type: SchemaType.Object },
              },
            },
          ],
        },
      },
    ]);
    expect(operation.responses?.[0]).toMatchObject({ binary: true });
  });

  it("generates supported Azure v1 SSE metadata without developer options", async () => {
    const program = await compileSseScenario("SseTest");
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

    const enabledModel = await build("azure");
    const enabledOperations = enabledModel.clients[0].operationGroups[0].operations!;
    const enabledOperation = enabledOperations.find(
      (operation) => operation.language.default.name === "retrieve",
    )!;
    expect(enabledOperation.generateProtocolApi).toBe(true);
    expect(enabledOperation.sseMetadata).toMatchObject({
      sseStreamId: "SseTest.RetrievalStreamEvents",
      streamName: "RetrievalStreamEvents",
      baseSchema: {
        language: {
          default: { name: "RetrievalStreamEvent" },
          java: { namespace: "ssetest.retrieve" },
        },
      },
      events: [
        {
          name: "retrieval.started",
          terminal: false,
          eventSchema: {
            language: { default: { name: "RetrievalStartedStreamEvent" } },
            properties: [
              {
                language: { default: { name: "value" } },
                required: true,
                readOnly: true,
                schema: { language: { default: { name: "RetrievalStarted" } } },
              },
            ],
          },
        },
        {
          name: "response.completed",
          terminal: true,
          eventSchema: {
            language: { default: { name: "RetrievalResponseCompletedStreamEvent" } },
            properties: [
              {
                language: { default: { name: "value" } },
                required: true,
                readOnly: true,
                schema: { language: { default: { name: "ResponseCompleted" } } },
              },
            ],
          },
        },
      ],
    });

    const protocolOnlyOperation = enabledOperations.find(
      (operation) => operation.language.default.name === "retrieveProtocol",
    )!;
    expect(protocolOnlyOperation.sseMetadata?.sseStreamId).toBe(
      enabledOperation.sseMetadata?.sseStreamId,
    );
    expect(protocolOnlyOperation.sseMetadata).not.toBe(enabledOperation.sseMetadata);
    expect(protocolOnlyOperation.sseMetadata).toMatchObject(enabledOperation.sseMetadata!);
    expect(protocolOnlyOperation.sseMetadata?.baseSchema).toBe(
      enabledOperation.sseMetadata?.baseSchema,
    );
    expect(protocolOnlyOperation.sseMetadata?.events[0].eventSchema).toBe(
      enabledOperation.sseMetadata?.events[0].eventSchema,
    );
    const serialized = parse(stringify(enabledModel));
    const serializedOperations = serialized.clients[0].operationGroups[0].operations;
    const serializedEnabledOperation = serializedOperations.find(
      (operation: any) => operation.language.default.name === "retrieve",
    );
    expect(serialized).not.toHaveProperty("sseStreams");
    expect(serializedEnabledOperation).not.toHaveProperty("sseStreamId");
    expect(serializedEnabledOperation.sseMetadata).toMatchObject({
      sseStreamId: "SseTest.RetrievalStreamEvents",
      streamName: "RetrievalStreamEvents",
    });
    expect(serializedEnabledOperation.sseMetadata).not.toHaveProperty("modelNamespace");
    expect(serializedEnabledOperation.sseMetadata.events[0]).not.toHaveProperty("payload");
    expect(serializedEnabledOperation.sseMetadata.baseSchema.type).toBe(SchemaType.Object);
    expect(protocolOnlyOperation.convenienceApi).toBeUndefined();
    expect(protocolOnlyOperation.generateProtocolApi).toBe(true);
    expect(protocolOnlyOperation.responses?.[0]).toMatchObject({ binary: true });

    const protocolOnlyPayloadOperation = enabledOperations.find(
      (operation) => operation.language.default.name === "protocolOnlyPayload",
    )!;
    expect(protocolOnlyPayloadOperation.sseMetadata?.sseStreamId).toBe(
      "SseTest.ProtocolOnlyStreamEvents",
    );
    expect(protocolOnlyPayloadOperation.convenienceApi).toBeUndefined();
    expect(protocolOnlyPayloadOperation.sseMetadata?.baseSchema.usage).toEqual([SchemaContext.Sse]);
    for (const event of protocolOnlyPayloadOperation.sseMetadata!.events) {
      expect(event.eventSchema.usage).toEqual([SchemaContext.Sse]);
    }
    const protocolOnlyPayload = enabledModel.schemas.objects?.find(
      (schema) => schema.language.default.name === "ProtocolOnlyPayload",
    );
    expect(protocolOnlyPayload).toBeDefined();
    expect(protocolOnlyPayload?.usage).toBeUndefined();
    expect(protocolOnlyPayload?.serializationFormats).toBeUndefined();
    const sharedTypedPayload = enabledModel.schemas.objects?.find(
      (schema) => schema.language.default.name === "RetrievalStarted",
    );
    expect(sharedTypedPayload?.usage).toContain(SchemaContext.Public);
    expect(sharedTypedPayload?.usage).toContain(SchemaContext.Output);
    expect(sharedTypedPayload?.serializationFormats).toContain(KnownMediaType.Json);

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

  it("preserves SSE patterns while leaving Java names for the generator", async () => {
    const program = await compileSseScenario("SseNaming");
    expectDiagnosticEmpty(program.diagnostics);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    const metadata = Object.fromEntries(
      model.clients[0].operationGroups[0].operations!.map((operation) => [
        operation.language.default.name,
        operation.sseMetadata!,
      ]),
    );

    expect(metadata.retrieval.baseSchema.language.default.name).toBe("RetrievalStreamEvent");
    expect(
      metadata.retrieval.events.map((event) => event.eventSchema.language.default.name),
    ).toEqual(["RetrievalStartedStreamEvent", "RetrievalResponseCompletedStreamEvent"]);
    expect(metadata.retrieval.baseSchema.language.java?.name).toBeUndefined();
    expect(metadata.retrieval.events.map((event) => event.eventSchema.language.java?.name)).toEqual(
      [undefined, undefined],
    );
    expect(metadata.knowledgeBase.baseSchema.language.default.name).toBe(
      "KnowledgeBaseRetrievalStreamEvent",
    );
    expect(
      metadata.knowledgeBase.events.map((event) => event.eventSchema.language.default.name),
    ).toEqual([
      "KnowledgeBaseRetrievalStartedStreamEvent",
      "KnowledgeBaseRetrievalCompletedStreamEvent",
      "KnowledgeBaseRetrievalActivityCompletedStreamEvent",
      "KnowledgeBaseRetrievalResponseCompletedStreamEvent",
    ]);
    expect(metadata.digitEvent.events[0].eventSchema.language.default.name).toBe(
      "123DoneStreamEvent",
    );
    expect(metadata.digitEvent.events[0].eventSchema.language.java?.name).toBeUndefined();
    expect(metadata.digitStream.baseSchema.language.default.name).toBe("123Event");
    expect(metadata.digitStream.baseSchema.language.java?.name).toBeUndefined();
  });

  it("keeps per-event names stable across additions and ordering", async () => {
    const build = async (namespace: string) => {
      const program = await compileSseScenario(namespace);
      expectDiagnosticEmpty(program.diagnostics);
      return new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor: "azure" },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build();
    };
    const eventNames = (model: Awaited<ReturnType<typeof build>>) =>
      new Map(
        model.clients[0].operationGroups[0].operations![0].sseMetadata!.events.map((event) => [
          event.name,
          event.eventSchema.language.default.name,
        ]),
      );

    const responseOnly = eventNames(await build("SseNamingResponseOnly"));
    const withRetrieval = eventNames(await build("SseNamingWithRetrieval"));
    expect(responseOnly.get("response.completed")).toBe(withRetrieval.get("response.completed"));
    const retrievalFirst = eventNames(await build("SseNamingOrderFirst"));
    const baseRetrievalFirst = eventNames(await build("SseNamingOrderSecond"));
    expect(retrievalFirst).toEqual(baseRetrievalFirst);
  });

  it("rejects duplicate SSE wrapper schema patterns in the emitter", async () => {
    const program = await compileSseScenario("SseNamingCollision");
    expectDiagnosticEmpty(program.diagnostics);
    await expect(
      new CodeModelBuilder(program, {
        program,
        emitterOutputDir: "/code-model-test-output",
        options: { flavor: "azure" },
        perf: {
          startTimer: () => ({ end: () => 0 }),
          time: (_label, callback) => callback(),
          timeAsync: (_label, callback) => callback(),
          report: () => {},
        },
      }).build(),
    ).rejects.toThrow("resolve to duplicate schema name 'RetrievalStartedStreamEvent'");
  });

  it("registers synthetic SSE schemas without propagating SSE usage to payloads", async () => {
    const program = await compileSseScenario("SseSchemaIsolation");
    expectDiagnosticEmpty(program.diagnostics);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    const operations = model.clients[0].operationGroups[0].operations!;
    const metadata = operations
      .filter((operation) => operation.sseMetadata)
      .map((operation) => operation.sseMetadata!);

    expect(new Set(metadata.map((value) => value.baseSchema)).size).toBe(4);
    for (const stream of metadata) {
      const hasTypedConsumer = operations.some(
        (operation) =>
          operation.convenienceApi && operation.sseMetadata?.baseSchema === stream.baseSchema,
      );
      expect(model.schemas.objects?.filter((schema) => schema === stream.baseSchema)).toHaveLength(
        1,
      );
      const expectedUsage = hasTypedConsumer
        ? [SchemaContext.Sse, SchemaContext.Output, SchemaContext.Public]
        : [SchemaContext.Sse];
      expect(new Set(stream.baseSchema.usage)).toEqual(new Set(expectedUsage));
      expect(stream.baseSchema).toMatchObject({
        sseMetadata: { streamName: stream.streamName },
      });
      expect(stream.baseSchema.children?.immediate).toEqual(
        stream.events.map((event) => event.eventSchema),
      );
      expect(stream.baseSchema.children?.all).toEqual(
        stream.events.map((event) => event.eventSchema),
      );
      for (const event of stream.events) {
        expect(
          model.schemas.objects?.filter((schema) => schema === event.eventSchema),
        ).toHaveLength(1);
        expect(new Set(event.eventSchema.usage)).toEqual(new Set(expectedUsage));
        expect(event.eventSchema).toMatchObject({
          sseMetadata: {
            streamName: stream.streamName,
            eventName: event.name,
            terminal: event.terminal,
          },
        });
        expect(event.eventSchema.parents?.immediate).toEqual([stream.baseSchema]);
        expect(event.eventSchema.parents?.all).toEqual([stream.baseSchema]);
        expect(
          event.eventSchema.properties?.map((property) => property.language.default.name),
        ).toEqual(["value"]);
        expect(
          (event.eventSchema.properties?.[0].schema as { usage?: SchemaContext[] }).usage ?? [],
        ).not.toContain(SchemaContext.Sse);
      }
    }
  });

  it("deduplicates registered SSE schemas with the ordinary naming policy", async () => {
    const program = await compileSseScenario("SseSchemaDeduplication");
    expectDiagnosticEmpty(program.diagnostics);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    const operations = Object.fromEntries(
      model.clients[0].operationGroups[0].operations!.map((operation) => [
        operation.language.default.name,
        operation.sseMetadata!,
      ]),
    );

    expect(operations.collision.baseSchema.language.default.name).toBe("CollisionEvent1");
    expect(operations.collision.events[0].eventSchema.language.default.name).toBe(
      "CollisionEventMessageStreamEvent",
    );
    expect(operations.exact.baseSchema.language.default.name).toBe("ExactCollisionEvent1");
    expect(operations.azure.baseSchema.language.default.name).toBe("AzureCollisionEvent");
    expect(operations.one.baseSchema.language.default.name).toBe("SharedEvent");
    expect(operations.two.baseSchema.language.default.name).toBe("SharedEvent1");
    expect(operations.one.events[0].eventSchema.language.default.name).toBe(
      "SharedEventMessageStreamEvent1",
    );
    expect(operations.two.events[0].eventSchema.language.default.name).toBe(
      "SharedEventMessageStreamEvent2",
    );
    expect(operations.again.baseSchema).toBe(operations.one.baseSchema);
    expect(operations.again).not.toBe(operations.one);
    expect(operations.again.events).not.toBe(operations.one.events);
    expect(operations.again.events[0]).not.toBe(operations.one.events[0]);
    expect(operations.again.events[0].eventSchema).toBe(operations.one.events[0].eventSchema);
    expect(operations.again.events[0].eventSchema.parents?.immediate?.[0]).toBe(
      operations.one.baseSchema,
    );
    expect(operations.again.events[0].eventSchema.parents?.all?.[0]).toBe(
      operations.one.baseSchema,
    );
    expect(
      model.schemas.objects?.find((schema) => schema.language.default.name === "CollisionEvent")
        ?.language.default.name,
    ).toBe("CollisionEvent");
    expect(
      model.schemas.objects?.find((schema) => schema.language.default.name === "CollisionEvent1")
        ?.language.default.name,
    ).toBe("CollisionEvent1");
  });

  it("preserves ordinary branded namespace exclusions for registered SSE schemas", async () => {
    const program = await compileSseScenario("Azure.SseSchemaDeduplication");
    expectDiagnosticEmpty(program.diagnostics);
    const model = await new CodeModelBuilder(program, {
      program,
      emitterOutputDir: "/code-model-test-output",
      options: { flavor: "azure" },
      perf: {
        startTimer: () => ({ end: () => 0 }),
        time: (_label, callback) => callback(),
        timeAsync: (_label, callback) => callback(),
        report: () => {},
      },
    }).build();
    const metadata = model.clients[0].operationGroups[0].operations!.find(
      (operation) => operation.language.default.name === "stream",
    )!.sseMetadata!;

    expect(metadata.baseSchema.language.default.name).toBe("SkippedEvent");
    expect(metadata.events[0].eventSchema.language.default.name).toBe(
      "SkippedEventMessageStreamEvent",
    );
    expect(model.schemas.objects?.map((schema) => schema.language.default.name)).toEqual(
      expect.arrayContaining(["SkippedEvent", "SkippedEventMessageStreamEvent"]),
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
