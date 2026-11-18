import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { expectDiagnostics, type TestHost } from "@typespec/compiler/testing";
import { deepStrictEqual, notStrictEqual, ok, strictEqual } from "assert";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "vitest";
import { serializeCodeModel } from "../../src/code-model-writer.js";
import { createModel } from "../../src/lib/client-model-builder.js";
import type { InputEnumType } from "../../src/type/input-type.js";
import { RequestLocation } from "../../src/type/request-location.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Operation Converter", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("emits the LRO metadata fixture consumed by the C# deserializer", async () => {
    const fixture = new URL(
      "../../../generator/Microsoft.TypeSpec.Generator.Input/test/TestData/InputServiceMethodTests/LoadsEmittedLroMetadata/",
      import.meta.url,
    );
    runner.addTypeSpecFile("main.tsp", readFileSync(new URL("main.tsp", fixture), "utf8"));
    await runner.compile("./", { noEmit: true });
    const sdkContext = await createCSharpSdkContext(createEmitterContext(runner.program));
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    const actual = JSON.parse(serializeCodeModel(sdkContext, root));
    const expected = JSON.parse(readFileSync(new URL("tspCodeModel.json", fixture), "utf8"));
    deepStrictEqual(actual, expected);
  });

  it.each(
    ["both", "body", "path", "none"].flatMap((selection) =>
      [true, false].map((pollingFirst) => ({ selection, pollingFirst })),
    ),
  )(
    "preserves LRO selections: $selection, polling operation declared first: $pollingFirst",
    async ({ selection, pollingFirst }) => {
      const selected = selection !== "none";
      const pollingOperation = `
        @get @route("/jobs/{jobId}/status")
        op getStatus(
          ${["both", "path"].includes(selection) ? "@lroOperationId" : ""}
          @path("jobId") id: string
        ): Monitor;
      `;
      const startOperation = `
        @post @route("/jobs")
        @pollingOperation(getStatus)
        op begin(): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        };
      `;
      const program = await typeSpecCompile(
        `
        model Statistics { completed: int32; }
        model BaseMonitor {
          ${selected ? "@lroStatusMetadata" : ""}
          @clientName("updatedAt")
          @encodedName("application/json", "last_updated")
          updated?: utcDateTime;
        }
        model Monitor extends BaseMonitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroResult result?: string;
          ${["both", "body"].includes(selection) ? "@lroOperationId" : ""}
          @clientName("jobId")
          @encodedName("application/json", "job_id")
          id: string;
          ${selected ? "@lroStatusMetadata" : ""}
          @clientName("progress")
          @encodedName("application/json", "percent_complete")
          percent?: int32;
          ${selected ? "@lroStatusMetadata" : ""}
          statistics?: Statistics;
        }
        ${pollingFirst ? `${pollingOperation}\n${startOperation}` : `${startOperation}\n${pollingOperation}`}
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const method = root.clients[0].methods.find((m) => m.name === "begin");
      ok(method?.kind === "lro");
      const metadata = method.lroMetadata;
      if (!selected) {
        strictEqual(metadata.statusMetadata, undefined);
        strictEqual(metadata.operationId, undefined);
        strictEqual(metadata.pollingResponseModel, undefined);
        const json = serializeCodeModel(sdkContext, root);
        strictEqual(json.includes('"statusMetadata"'), false);
        strictEqual(json.includes('"operationId"'), false);
        strictEqual(json.includes('"pollingResponseModel"'), false);
        return;
      }
      strictEqual(
        metadata.pollingResponseModel,
        root.models.find((m) => m.name === "Monitor"),
      );
      deepStrictEqual(
        metadata.statusMetadata?.map((entry) => [
          entry.property.name,
          entry.property.optional,
          entry.propertySegments.map((p) => p.serializedName),
        ]),
        [
          ["progress", true, ["percent_complete"]],
          ["statistics", true, ["statistics"]],
          ["updatedAt", true, ["last_updated"]],
        ],
      );
      for (const entry of metadata.statusMetadata!) {
        strictEqual(entry.propertySegments[0], entry.property);
      }
      const baseMonitor = root.models.find((m) => m.name === "BaseMonitor");
      ok(baseMonitor);
      strictEqual(
        metadata.statusMetadata![2].property,
        baseMonitor.properties.find((p) => p.name === "updatedAt"),
      );
      const statistics = metadata.statusMetadata![1].property.type;
      strictEqual(
        statistics,
        root.models.find((m) => m.name === "Statistics"),
      );
      ok(statistics.kind === "model");
      strictEqual(statistics.properties[0].name, "completed");
      deepStrictEqual(
        metadata.operationId?.map((entry) => entry.kind),
        selection === "both" ? ["path", "property"] : [selection === "body" ? "property" : "path"],
      );
      for (const entry of metadata.operationId!) {
        if (entry.kind === "path") {
          strictEqual(entry.pollingPath, "/jobs/{jobId}/status");
          strictEqual(entry.pathParameter.serializedName, "jobId");
          strictEqual(
            entry.pathParameter,
            root.clients[0].methods
              .find((m) => m.name === "getStatus")!
              .operation.parameters.find((p) => p.kind === "path"),
          );
          strictEqual(entry.source.location, "ResponseHeader");
          strictEqual(entry.source.property.serializedName, "Operation-Location");
          const sdkMethod = sdkContext.sdkPackage.clients[0].methods.find(
            (m) => m.name === "begin",
          );
          ok(sdkMethod?.kind === "lro");
          const sdkPath = sdkMethod.lroMetadata.operationId?.find((id) => id.kind === "path");
          ok(sdkPath?.kind === "path");
          const cachedSourceProperty = sdkContext.__typeCache.properties.get(
            sdkPath.source.property,
          );
          ok(cachedSourceProperty);
          strictEqual(
            cachedSourceProperty.serializedName,
            sdkPath.source.property.serializationOptions.json?.name ??
              sdkPath.source.property.serializationOptions.xml?.name ??
              sdkPath.source.property.serializationOptions.multipart?.name,
          );
          notStrictEqual(entry.source.property, cachedSourceProperty);
        } else {
          strictEqual(entry.property.name, "jobId");
          strictEqual(entry.propertySegments[0], entry.property);
          strictEqual(entry.property.serializedName, "job_id");
        }
      }
      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      const serializedMetadata = serialized.clients[0].methods.find(
        (m: { name: string }) => m.name === "begin",
      ).lroMetadata;
      const serializedMonitor =
        serialized.models[root.models.indexOf(metadata.pollingResponseModel!)];
      strictEqual(
        serializedMetadata.pollingResponseModel.$ref ?? serializedMetadata.pollingResponseModel.$id,
        serializedMonitor.$ref ?? serializedMonitor.$id,
      );
      deepStrictEqual(
        serializedMetadata.statusMetadata.map(
          (entry: { property: object; propertySegments: object[] }) => entry.propertySegments[0],
        ),
        serializedMetadata.statusMetadata.map(
          (entry: { property: { $ref: string; $id: string } }) => ({
            $ref: entry.property.$ref ?? entry.property.$id,
          }),
        ),
      );
      deepStrictEqual(
        serializedMetadata.operationId.map((entry: { kind: string }) => entry.kind),
        metadata.operationId!.map((entry) => entry.kind),
      );
      if (["both", "path"].includes(selection)) {
        const serializedPath = serializedMetadata.operationId.find(
          (entry: { kind: string }) => entry.kind === "path",
        ).pathParameter;
        const pollingMethod = root.clients[0].methods.find((m) => m.name === "getStatus")!;
        const parameterIndex = pollingMethod.operation.parameters.findIndex(
          (p) => p.kind === "path" && p.serializedName === "jobId",
        );
        ok(parameterIndex >= 0);
        const serializedPollingParameter = serialized.clients[0].methods.find(
          (m: { name: string }) => m.name === "getStatus",
        ).operation.parameters[parameterIndex];
        strictEqual(
          serializedPath.$id ?? serializedPath.$ref,
          serializedPollingParameter.$id ?? serializedPollingParameter.$ref,
        );
        ok(serializedPath.$ref || serializedPollingParameter.$ref);
      }
    },
  );

  it.each([
    "missing polling operation",
    "missing path parameter",
    "missing header source",
    "unknown link location",
  ])("reports a diagnostic for an LRO operation ID with %s", async (malformation) => {
    const program = await typeSpecCompile(
      `
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroResult result?: string;
          @lroOperationId id: string;
        }
        @get @route("/jobs/{jobId}/status")
        op getStatus(@lroOperationId @path("jobId") id: string): Monitor;
        @post @route("/jobs") @pollingOperation(getStatus)
        op begin(): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        };
        `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const sdkMethod = sdkContext.sdkPackage.clients[0].methods.find((m) => m.name === "begin");
    ok(sdkMethod?.kind === "lro");
    const path = sdkMethod.lroMetadata.operationId?.find((entry) => entry.kind === "path");
    ok(path?.kind === "path");
    switch (malformation) {
      case "missing polling operation":
        sdkMethod.lroMetadata.statusMonitorStep = undefined;
        break;
      case "missing path parameter":
        path.pathParameter.crossLanguageDefinitionId = "missing.parameter";
        break;
      case "missing header source":
        path.source.property.__raw = undefined;
        break;
      case "unknown link location":
        // Simulate an unrecognized location from a future TCGC version.
        // @ts-expect-error The current TCGC type lists only known locations.
        path.source.location = "FutureLocation";
        break;
    }
    const [root, diagnostics] = createModel(sdkContext);
    const method = root.clients[0].methods.find((m) => m.name === "begin");
    ok(method?.kind === "lro");
    deepStrictEqual(
      method.lroMetadata.operationId?.map((entry) => entry.kind),
      ["property"],
    );
    expectDiagnostics(diagnostics, {
      severity: "error",
      code: "@typespec/http-client-csharp/general-error",
      message: /Invalid LRO metadata for 'begin': .*operation ID/,
    });
  });

  it("reports an empty status metadata path without dropping valid selections", async () => {
    const program = await typeSpecCompile(
      `
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroResult result?: string;
        @lroStatusMetadata progress?: int32;
        @lroOperationId id: string;
      }
      @get @route("/jobs/{jobId}/status")
      op getStatus(@lroOperationId @path("jobId") id: string): Monitor;
      @post @route("/jobs") @pollingOperation(getStatus)
      op begin(): {
        @statusCode code: 202;
        @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
      };
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const sdkMethod = sdkContext.sdkPackage.clients[0].methods.find((m) => m.name === "begin");
    ok(sdkMethod?.kind === "lro");
    ok(sdkMethod.lroMetadata.statusMetadata?.[0]);
    sdkMethod.lroMetadata.statusMetadata[0].propertySegments = [];

    const [root, diagnostics] = createModel(sdkContext);
    const method = root.clients[0].methods.find((m) => m.name === "begin");
    ok(method?.kind === "lro");
    deepStrictEqual(method.lroMetadata.statusMetadata, []);
    deepStrictEqual(
      method.lroMetadata.operationId?.map((entry) => entry.kind),
      ["path", "property"],
    );
    expectDiagnostics(diagnostics, {
      severity: "error",
      code: "@typespec/http-client-csharp/general-error",
      message:
        "Invalid LRO metadata for 'begin': a selected property must have a nonempty property path.",
    });
  });

  it("shares the selected parameter with a polling operation in another client", async () => {
    const program = await typeSpecCompile(
      `
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroResult result?: string;
      }
      interface Start {
        @post @route("/jobs") @pollingOperation(Polling.getStatus)
        begin(): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        };
      }
      interface Polling {
        @get @route("/jobs/{jobId}/status")
        getStatus(@lroOperationId @path("jobId") id: string): Monitor;
      }
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    const clients = [...root.clients];
    for (let index = 0; index < clients.length; index++) {
      clients.push(...(clients[index].children ?? []));
    }
    const methods = clients.flatMap((client) => client.methods);
    const start = methods.find((method) => method.name === "begin");
    const poll = methods.find((method) => method.name === "getStatus");
    ok(start?.kind === "lro");
    ok(poll);
    const path = start.lroMetadata.operationId?.find((entry) => entry.kind === "path");
    ok(path?.kind === "path");
    strictEqual(
      path.pathParameter,
      poll.operation.parameters.find((parameter) => parameter.kind === "path"),
    );
  });

  it("preserves a path selection when the polling operation is not exposed as a client method", async () => {
    const program = await typeSpecCompile(
      `
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroResult result?: string;
      }
      @get @route("/jobs/{jobId}/status")
      op getStatus(@lroOperationId @path("jobId") id: string): Monitor;
      @post @route("/jobs") @pollingOperation(getStatus)
      op begin(): {
        @statusCode code: 202;
        @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
      };
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const client = sdkContext.sdkPackage.clients[0];
    client.methods = client.methods.filter((method) => method.name !== "getStatus");

    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    const method = root.clients[0].methods.find((m) => m.name === "begin");
    ok(method?.kind === "lro");
    const path = method.lroMetadata.operationId?.find((entry) => entry.kind === "path");
    ok(path?.kind === "path");
    strictEqual(path.pathParameter.serializedName, "jobId");
    strictEqual(path.pollingPath, "/jobs/{jobId}/status");
  });

  it.each([
    { expansion: "{jobId}", style: "simple" },
    { expansion: "{.jobId}", style: "label" },
    { expansion: "{;jobId}", style: "matrix" },
    { expansion: "{/jobId}", style: "path" },
    { expansion: "{#jobId}", style: "fragment" },
  ])(
    "preserves the $style style and shared identity of a spread polling ID",
    async ({ expansion, style }) => {
      const program = await typeSpecCompile(
        `
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroResult result?: string;
        }
        model PollingParameters {
          @lroOperationId @path("jobId") id: string;
        }
        @get @route("/jobs${expansion}/status")
        op getStatus(...PollingParameters): Monitor;
        @post @route("/jobs") @pollingOperation(getStatus)
        op begin(): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        };
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const start = root.clients[0].methods.find((method) => method.name === "begin");
      const poll = root.clients[0].methods.find((method) => method.name === "getStatus");
      ok(start?.kind === "lro");
      ok(poll);
      const selected = start.lroMetadata.operationId?.find((entry) => entry.kind === "path");
      ok(selected?.kind === "path");
      const parameter = poll.operation.parameters.find((parameter) => parameter.kind === "path");
      ok(parameter?.kind === "path");
      strictEqual(selected.pathParameter, parameter);
      strictEqual(selected.pollingPath, "/jobs{jobId}/status");
      strictEqual(parameter.serializedName, "jobId");
      strictEqual(parameter.style, style);

      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      const serializedStart = serialized.clients[0].methods.find(
        (method: { name: string }) => method.name === "begin",
      );
      const serializedPoll = serialized.clients[0].methods.find(
        (method: { name: string }) => method.name === "getStatus",
      );
      const serializedSelection = serializedStart.lroMetadata.operationId.find(
        (entry: { kind: string }) => entry.kind === "path",
      );
      const serializedParameter = serializedPoll.operation.parameters.find(
        (entry: { kind: string }) => entry.kind === "path",
      );
      strictEqual(
        serializedSelection.pathParameter.$id ?? serializedSelection.pathParameter.$ref,
        serializedParameter.$id ?? serializedParameter.$ref,
      );
      ok(serializedSelection.pathParameter.$ref || serializedParameter.$ref);
      strictEqual(
        (serializedParameter.$ref ? serializedSelection.pathParameter : serializedParameter).style,
        style,
      );
    },
  );

  it.each([true, false])(
    "preserves selected properties without converting an unexposed polling model, path ID: %s",
    async (hasPathId) => {
      const program = await typeSpecCompile(
        `
      model Details { value: string; }
      model FinalResult { value: string; }
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata details?: Details;
        unrelated: [string, int32];
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(${hasPathId ? "@lroOperationId" : ""} @path("jobId") id: string): Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @client({ service: Azure.Csharp.Testing })
      interface PublicOperations {
        @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
        @useFinalStateVia("original-uri")
        @convenientAPI(false, "csharp")
        op begin(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      }
      `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const client = sdkContext.sdkPackage.clients[0];
      strictEqual(
        client.methods.some((method) => method.name === "getStatus"),
        false,
      );
      strictEqual(
        sdkContext.sdkPackage.models.some((model) => model.name === "Monitor"),
        false,
      );
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(
        diagnostics.map((diagnostic) => diagnostic.code),
        [],
      );
      const method = root.clients[0].methods.find((m) => m.name === "begin");
      ok(method?.kind === "lro");
      strictEqual(method.lroMetadata.pollingResponseModel, undefined);
      strictEqual(method.lroMetadata.operationId?.length ?? 0, hasPathId ? 1 : 0);
      strictEqual(
        root.models.some((model) => model.name === "Monitor"),
        false,
      );
      const selection = method.lroMetadata.statusMetadata?.[0];
      ok(selection);
      strictEqual(selection.propertySegments[0], selection.property);
      ok(selection.property.type.kind === "model");
      strictEqual(selection.property.type.properties[0].name, "value");
      strictEqual(
        selection.property.type,
        root.models.find((model) => model.name === "Details"),
      );
      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      const serializedMethod = serialized.clients[0].methods.find(
        (m: { name: string }) => m.name === "begin",
      );
      const serializedSelection = serializedMethod.lroMetadata.statusMetadata[0];
      strictEqual(serializedMethod.lroMetadata.pollingResponseModel, undefined);
      strictEqual(serializedSelection.propertySegments[0].$ref, serializedSelection.property.$id);
      strictEqual(
        serializedSelection.property.type.$ref,
        serialized.models.find((model: { name: string }) => model.name === "Details").$id,
      );
    },
  );

  it.each([true, false])(
    "retains an exposed protocol-only polling model when declared first: %s",
    async (pollingFirst) => {
      const pollingOperation = `
        @get @route("/jobs/{jobId}/status")
        @convenientAPI(false, "csharp")
        op getStatus(@lroOperationId @path("jobId") id: string): Monitor;
      `;
      const startOperation = `
        @post @route("/jobs") @pollingOperation(getStatus)
        @convenientAPI(false, "csharp")
        op begin(): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        };
      `;
      const program = await typeSpecCompile(
        `
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroResult result?: string;
          @lroStatusMetadata progress?: int32;
        }
        ${pollingFirst ? `${pollingOperation}\n${startOperation}` : `${startOperation}\n${pollingOperation}`}
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      strictEqual(
        sdkContext.sdkPackage.models.some((model) => model.name === "Monitor"),
        false,
      );
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const method = root.clients[0].methods.find((m) => m.name === "begin");
      ok(method?.kind === "lro");
      const monitor = method.lroMetadata.pollingResponseModel;
      ok(monitor);
      strictEqual(
        monitor,
        root.models.find((model) => model.name === "Monitor"),
      );
      strictEqual(
        method.lroMetadata.statusMetadata?.[0].property,
        monitor.properties.find((property) => property.name === "progress"),
      );
    },
  );

  it.each([true, false])(
    "uses a monitor exposed by a different protocol-only method regardless of its order: %s",
    async (readerFirst) => {
      const reader = `
        @get @route("/inspect")
        @convenientAPI(false, "csharp")
        op inspect(): Monitor;
      `;
      const start = `
        @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
        @useFinalStateVia("original-uri")
        @convenientAPI(false, "csharp")
        op begin(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      `;
      const program = await typeSpecCompile(
        `
        model FinalResult { value: string; }
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroStatusMetadata progress?: int32;
        }
        @get @route("/jobs/{jobId}/status")
        op getStatus(@path("jobId") id: string): Monitor;
        @get @route("/jobs/{jobId}")
        op getResult(@path("jobId") id: string): FinalResult;
        @client({ service: Azure.Csharp.Testing })
        interface PublicOperations {
          ${readerFirst ? `${reader}\n${start}` : `${start}\n${reader}`}
        }
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      strictEqual(
        sdkContext.sdkPackage.models.some((model) => model.name === "Monitor"),
        false,
      );
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const method = root.clients[0].methods.find((method) => method.name === "begin");
      ok(method?.kind === "lro");
      const monitor = root.models.find((model) => model.name === "Monitor");
      ok(monitor);
      strictEqual(method.lroMetadata.pollingResponseModel === monitor, true);
      strictEqual(
        method.lroMetadata.statusMetadata?.[0].property,
        monitor.properties.find((property) => property.name === "progress"),
      );
      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      const serializedMethod = serialized.clients[0].methods.find(
        (method: { name: string }) => method.name === "begin",
      );
      const serializedMonitor = serialized.models.find(
        (model: { name: string }) => model.name === "Monitor",
      );
      strictEqual(serializedMethod.lroMetadata.pollingResponseModel.$ref, serializedMonitor.$id);
    },
  );

  it("does not convert the original polling model when the exposed response uses an alternate type", async () => {
    const program = await typeSpecCompile(
      `
      model FinalResult { value: string; }
      model Replacement { value: string; }
      @alternateType(Replacement, "csharp")
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata progress?: int32;
        unrelated: [string, int32];
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(@path("jobId") id: string): Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
      @useFinalStateVia("original-uri")
      @convenientAPI(false, "csharp")
      op begin(@path("jobId") id: string): {
        @statusCode code: 202;
        @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
        @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
      };
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const sdkStart = sdkContext.sdkPackage.clients[0].methods.find(
      (method) => method.name === "begin",
    );
    const sdkPoll = sdkContext.sdkPackage.clients[0].methods.find(
      (method) => method.name === "getStatus",
    );
    ok(sdkStart?.kind === "lro");
    ok(sdkPoll);
    strictEqual(sdkStart.lroMetadata.pollingInfo.responseModel.name, "Monitor");
    strictEqual(
      sdkPoll.operation.responses.some(
        (response) => response.type?.kind === "model" && response.type.name === "Replacement",
      ),
      true,
    );
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.code),
      [],
    );
    const method = root.clients[0].methods.find((method) => method.name === "begin");
    ok(method?.kind === "lro");
    strictEqual(method.lroMetadata.pollingResponseModel, undefined);
    strictEqual(
      root.models.some((model) => model.name === "Monitor"),
      false,
    );
    strictEqual(method.lroMetadata.statusMetadata?.[0].property.name, "progress");
  });

  it("preserves effective scoped access on the type graph of a hidden monitor selection", async () => {
    const program = await typeSpecCompile(
      `
      enum State { Ready: "ready", Waiting: "waiting" }
      model BaseDetails { state: State; }
      model NestedDetails extends BaseDetails { value: string; }
      model Details { nested: NestedDetails; }
      model PublicDetails { value: string; }
      model FinalResult { value: string; }
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata @access(Access.internal, "csharp")
        details?: Details;
        @lroStatusMetadata @access(Access.internal, "csharp")
        publicDetails?: PublicDetails;
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(@path("jobId") id: string): Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @client({ service: Azure.Csharp.Testing })
      interface PublicOperations {
        @get @route("/publicDetails") op readPublicDetails(): PublicDetails;
        @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
        @useFinalStateVia("original-uri") @access(Access.internal, "csharp")
        @convenientAPI(false, "csharp")
        op begin(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      }
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    deepStrictEqual(sdkContext.diagnostics, []);
    strictEqual(
      sdkContext.sdkPackage.models.find((model) => model.name === "Details")?.access,
      "internal",
    );
    strictEqual(
      sdkContext.sdkPackage.models.find((model) => model.name === "NestedDetails")?.access,
      "internal",
    );
    strictEqual(
      sdkContext.sdkPackage.models.find((model) => model.name === "BaseDetails")?.access,
      "internal",
    );
    strictEqual(
      sdkContext.sdkPackage.models.find((model) => model.name === "PublicDetails")?.access,
      "public",
    );
    strictEqual(
      sdkContext.sdkPackage.enums.find((type) => type.name === "State")?.access,
      "internal",
    );
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    strictEqual(
      root.models.some((model) => model.name === "Monitor"),
      false,
    );
    const method = root.clients[0].methods.find((method) => method.name === "begin");
    ok(method?.kind === "lro");
    strictEqual(method.lroMetadata.statusMetadata?.[0].property.access, "internal");
    const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
    const serializedMethod = serialized.clients[0].methods.find(
      (method: { name: string }) => method.name === "begin",
    );
    strictEqual(serializedMethod.lroMetadata.statusMetadata[0].property.access, "internal");
    strictEqual(root.models.find((model) => model.name === "Details")?.access, "internal");
    strictEqual(root.models.find((model) => model.name === "NestedDetails")?.access, "internal");
    strictEqual(root.models.find((model) => model.name === "BaseDetails")?.access, "internal");
    strictEqual(root.models.find((model) => model.name === "PublicDetails")?.access, undefined);
    strictEqual(root.enums.find((type) => type.name === "State")?.access, "internal");
  });

  it("does not apply a selection access override scoped to another emitter", async () => {
    const program = await typeSpecCompile(
      `
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroResult result?: string;
        @lroStatusMetadata @access(Access.internal, "python")
        progress?: int32;
      }
      @get @route("/jobs/{jobId}/status")
      op getStatus(@path("jobId") id: string): Monitor;
      @post @route("/jobs") @pollingOperation(getStatus)
      op begin(): {
        @statusCode code: 202;
        @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
      };
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    const method = root.clients[0].methods.find((method) => method.name === "begin");
    ok(method?.kind === "lro");
    strictEqual(method.lroMetadata.statusMetadata?.[0].property.access, undefined);
  });

  it.each(
    ['"ready"', '"ready" | null'].flatMap((literal) => [
      { literal, ownerAccess: true, propertyAccess: false },
      { literal, ownerAccess: false, propertyAccess: true },
    ]),
  )(
    "normalizes a hidden enum selection: $literal, internal owner: $ownerAccess",
    async ({ literal, ownerAccess, propertyAccess }) => {
      const program = await typeSpecCompile(
        `
      model FinalResult { value: string; }
      ${ownerAccess ? '@access(Access.internal, "csharp")' : ""}
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata ${propertyAccess ? '@access(Access.internal, "csharp")' : ""}
        mode?: ${literal};
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(@path("jobId") id: string): Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @client({ service: Azure.Csharp.Testing })
      interface PublicOperations {
        @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
        @useFinalStateVia("original-uri") @access(Access.internal, "csharp")
        @convenientAPI(false, "csharp")
        op begin(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      }
      `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const sdkStart = sdkContext.sdkPackage.clients[0].methods.find(
        (method) => method.name === "begin",
      );
      ok(sdkStart?.kind === "lro");
      strictEqual(
        sdkStart.lroMetadata.pollingInfo.responseModel.access,
        ownerAccess ? "internal" : "public",
      );
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const method = root.clients[0].methods.find((method) => method.name === "begin");
      ok(method?.kind === "lro");
      let selected = method.lroMetadata.statusMetadata?.[0].property.type;
      if (selected?.kind === "nullable") selected = selected.type;
      ok(selected?.kind === "enum");
      strictEqual(selected.name, "MonitorMode");
      strictEqual(selected.access, "internal");
      ok(selected.usage & UsageFlags.Output);
      strictEqual(root.enums.includes(selected), true);
      strictEqual(
        root.models.some((model) => model.name === "Monitor"),
        false,
      );
    },
  );

  it.each(["waiting", "ready"])(
    "emits distinct literal enums for same-named hidden monitors: %s",
    async (secondValue) => {
      const program = await typeSpecCompile(
        `
      namespace First {
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroStatusMetadata mode?: "ready";
        }
      }
      namespace Second {
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroStatusMetadata mode?: "${secondValue}";
        }
      }
      enum MonitorMode { Known: "known" }
      model MonitorMode1 { value: string; }
      model FinalResult { value: string; }
      @get @route("/first/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getFirstStatus(@path("jobId") id: string): First.Monitor;
      @get @route("/second/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getSecondStatus(@path("jobId") id: string): Second.Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @client({ service: Azure.Csharp.Testing })
      interface PublicOperations {
        @get @route("/known") op readKnown(): MonitorMode;
        @get @route("/known-model") op readKnownModel(): MonitorMode1;
        @post @route("/first/{jobId}") @pollingOperation(getFirstStatus)
        @finalOperation(getResult) @useFinalStateVia("original-uri")
        @convenientAPI(false, "csharp")
        op beginFirst(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<First.Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
        @post @route("/second/{jobId}") @pollingOperation(getSecondStatus)
        @finalOperation(getResult) @useFinalStateVia("original-uri")
        @convenientAPI(false, "csharp")
        op beginSecond(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Second.Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      }
      `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const first = root.clients[0].methods.find((method) => method.name === "beginFirst");
      const second = root.clients[0].methods.find((method) => method.name === "beginSecond");
      ok(first?.kind === "lro");
      ok(second?.kind === "lro");
      const firstEnum = first.lroMetadata.statusMetadata?.[0].property.type;
      const secondEnum = second.lroMetadata.statusMetadata?.[0].property.type;
      ok(firstEnum?.kind === "enum");
      ok(secondEnum?.kind === "enum");
      notStrictEqual(firstEnum, secondEnum);
      deepStrictEqual(
        firstEnum.values.map((value) => value.value),
        ["ready"],
      );
      deepStrictEqual(
        secondEnum.values.map((value) => value.value),
        [secondValue],
      );
      strictEqual(root.enums.includes(firstEnum), true);
      strictEqual(root.enums.includes(secondEnum), true);
      const knownEnum = root.enums.find((type) =>
        type.crossLanguageDefinitionId.endsWith(".MonitorMode"),
      );
      const knownModel = root.models.find((type) => type.name === "MonitorMode1");
      ok(knownEnum);
      ok(knownModel);
      strictEqual(knownEnum.name, "MonitorMode");
      strictEqual(
        new Set([knownEnum.name, knownModel.name, firstEnum.name, secondEnum.name]).size,
        4,
      );
      strictEqual(
        root.models.some((model) => model.name === "Monitor"),
        false,
      );
      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      for (const [methodName, enumType] of [
        ["beginFirst", firstEnum],
        ["beginSecond", secondEnum],
      ] as const) {
        const method = serialized.clients[0].methods.find(
          (candidate: { name: string }) => candidate.name === methodName,
        );
        const propertyType = method.lroMetadata.statusMetadata[0].property.type;
        const serializedEnum = serialized.enums[root.enums.indexOf(enumType)];
        strictEqual(
          propertyType.$ref ?? propertyType.$id,
          serializedEnum.$ref ?? serializedEnum.$id,
        );
      }
    },
  );

  it.each([
    {
      description: "client type",
      monitor: "Testing",
      property: "client",
      client: "TestingClient",
      knownType: "",
      knownOperation: "",
      expected: "TestingClient1",
    },
    {
      description: "normalized model type",
      monitor: "Monitor",
      property: "some_mode",
      client: "PublicOperations",
      knownType: "model MonitorSomeMode { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeMode;',
      expected: "MonitorSome_mode1",
    },
    {
      description: "normalized enum type",
      monitor: "Monitor",
      property: "some_mode",
      client: "PublicOperations",
      knownType: 'enum MonitorSomeMode { Known: "known" }',
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeMode;',
      expected: "MonitorSome_mode1",
    },
    {
      description: "separator-normalized type",
      monitor: "Monitor",
      property: '@clientName("some-mode", "csharp") someMode',
      client: "PublicOperations",
      knownType: "model MonitorSomeMode { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeMode;',
      expected: "MonitorSome-mode1",
    },
    {
      description: "Unicode-cased type",
      monitor: "Monitor",
      property: '@clientName("some_\u03c2_code", "csharp") someSigma',
      client: "PublicOperations",
      knownType:
        '@clientName(Azure.ClientGenerator.Core.exact("MonitorSome\u03a3Code"), "csharp") model Known { value: string; }',
      knownOperation: '@get @route("/known") op readKnown(): Known;',
      expected: "MonitorSome_\u03c2_code1",
    },
    {
      description: "supplementary-character-normalized type",
      monitor: "Monitor",
      property: '@clientName("some_\u{10400}mode", "csharp") someMode',
      client: "PublicOperations",
      knownType: "model MonitorSomeMode { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeMode;',
      expected: "MonitorSome_\u{10400}mode1",
    },
    {
      description: "request model projected to a content type",
      monitor: "Monitor",
      property: "someContent",
      client: "PublicOperations",
      knownType: "model MonitorSomeRequest { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeRequest;',
      expected: "MonitorSomeContent1",
    },
    {
      description: "response model projected to a result type",
      monitor: "Monitor",
      property: "someResult",
      client: "PublicOperations",
      knownType: "model MonitorSomeResponse { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeResponse;',
      expected: "MonitorSomeResult1",
    },
    {
      description: "exact response model type",
      monitor: "Monitor",
      property: "someResult",
      client: "PublicOperations",
      knownType:
        '@clientName(Azure.ClientGenerator.Core.exact("MonitorSomeResponse"), "csharp") model Known { value: string; }',
      knownOperation: '@get @route("/known") op readKnown(): Known;',
      expected: "MonitorSomeResult",
    },
    {
      description: "distinct type",
      monitor: "Monitor",
      property: "other_mode",
      client: "PublicOperations",
      knownType: "model MonitorSomeMode { value: string; }",
      knownOperation: '@get @route("/known") op readKnown(): MonitorSomeMode;',
      expected: "MonitorOther_mode",
    },
    {
      description: "exact projected model type",
      monitor: "Monitor",
      property: "some_mode",
      client: "PublicOperations",
      knownType:
        '@clientName(Azure.ClientGenerator.Core.exact("MonitorSomeMode"), "csharp") model Known { value: string; }',
      knownOperation: '@get @route("/known") op readKnown(): Known;',
      expected: "MonitorSome_mode1",
    },
    {
      description: "distinct exact model type",
      monitor: "Monitor",
      property: "some_mode",
      client: "PublicOperations",
      knownType:
        '@clientName(Azure.ClientGenerator.Core.exact("MonitorSome_mode"), "csharp") model Known { value: string; }',
      knownOperation: '@get @route("/known") op readKnown(): Known;',
      expected: "MonitorSome_mode",
    },
  ])(
    "avoids a metadata literal enum collision with a $description",
    async ({ monitor, property, client, knownType, knownOperation, expected }) => {
      const program = await typeSpecCompile(
        `
        ${knownType}
        model FinalResult { value: string; }
        model ${monitor} {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroStatusMetadata ${property}?: "ready";
        }
        @get @route("/jobs/{jobId}/status")
        @convenientAPI(false, "csharp")
        op getStatus(@path("jobId") id: string): ${monitor};
        @get @route("/jobs/{jobId}")
        @convenientAPI(false, "csharp")
        op getResult(@path("jobId") id: string): FinalResult;
        @client({ service: Azure.Csharp.Testing })
        interface ${client} {
          ${knownOperation}
          @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
          @useFinalStateVia("original-uri") @convenientAPI(false, "csharp")
          op begin(@path("jobId") id: string): {
            @statusCode code: 202;
            @pollingLocation @header("Operation-Location") location: ResourceLocation<${monitor}>;
            @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
          };
        }
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      strictEqual(root.clients[0].name, client);
      const method = root.clients[0].methods.find((candidate) => candidate.name === "begin");
      ok(method?.kind === "lro");
      const selected = method.lroMetadata.statusMetadata?.[0].property.type;
      ok(selected?.kind === "enum");
      strictEqual(selected.name, expected);
      strictEqual(root.enums.includes(selected), true);
    },
  );

  it("avoids a metadata literal enum collision with a nested client", async () => {
    const program = await typeSpecCompile(
      `
      model FinalResult { value: string; }
      model Testing {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata client?: "ready";
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(@path("jobId") id: string): Testing;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
      @useFinalStateVia("original-uri") @convenientAPI(false, "csharp")
      op begin(@path("jobId") id: string): {
        @statusCode code: 202;
        @pollingLocation @header("Operation-Location") location: ResourceLocation<Testing>;
        @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
      };
      interface TestingClient {
        @get @route("/ping") op ping(): void;
      }
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    ok(root.clients[0].children?.some((client) => client.name === "TestingClient"));
    const method = root.clients[0].methods.find((candidate) => candidate.name === "begin");
    ok(method?.kind === "lro");
    const selected = method.lroMetadata.statusMetadata?.[0].property.type;
    ok(selected?.kind === "enum");
    strictEqual(selected.name, "TestingClient1");
  });

  it("avoids normalized-name collisions between selected literal enums", async () => {
    const program = await typeSpecCompile(
      `
      model FinalResult { value: string; }
      model Monitor {
        @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
        @lroStatusMetadata some_mode?: "ready";
        @lroStatusMetadata someMode?: "waiting";
      }
      @get @route("/jobs/{jobId}/status")
      @convenientAPI(false, "csharp")
      op getStatus(@path("jobId") id: string): Monitor;
      @get @route("/jobs/{jobId}")
      @convenientAPI(false, "csharp")
      op getResult(@path("jobId") id: string): FinalResult;
      @client({ service: Azure.Csharp.Testing })
      interface PublicOperations {
        @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
        @useFinalStateVia("original-uri") @convenientAPI(false, "csharp")
        op begin(@path("jobId") id: string): {
          @statusCode code: 202;
          @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
          @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
        };
      }
      `,
      runner,
      { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root, diagnostics] = createModel(sdkContext);
    deepStrictEqual(diagnostics, []);
    const method = root.clients[0].methods.find((candidate) => candidate.name === "begin");
    ok(method?.kind === "lro");
    const selections = method.lroMetadata.statusMetadata;
    ok(selections);
    deepStrictEqual(
      selections.map((entry) => {
        const type = entry.property.type;
        ok(type.kind === "enum");
        return type.name;
      }),
      ["MonitorSome_mode", "MonitorSomeMode1"],
    );
  });

  it.each([
    { optional: true, shareSdkType: false },
    { optional: false, shareSdkType: false },
    { optional: true, shareSdkType: true },
  ])(
    "keeps a shared model's literal type, optional: $optional, shared SDK type: $shareSdkType",
    async ({ optional, shareSdkType }) => {
      const program = await typeSpecCompile(
        `
        model Shared { value${optional ? "?" : ""}: "ready"; }
        model FinalResult { value: string; }
        model Monitor {
          @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
          @lroStatusMetadata mode?: "ready";
        }
        @get @route("/jobs/{jobId}/status")
        op getStatus(@path("jobId") id: string): Monitor;
        @get @route("/jobs/{jobId}")
        op getResult(@path("jobId") id: string): FinalResult;
        @client({ service: Azure.Csharp.Testing })
        interface PublicOperations {
          @post @route("/shared") op useShared(@body input: Shared): void;
          @post @route("/jobs/{jobId}") @pollingOperation(getStatus) @finalOperation(getResult)
          @useFinalStateVia("original-uri") @convenientAPI(false, "csharp")
          op begin(@path("jobId") id: string): {
            @statusCode code: 202;
            @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
            @finalLocation @header("Location") finalLocation: ResourceLocation<FinalResult>;
          };
        }
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      if (shareSdkType) {
        const sharedModel = sdkContext.sdkPackage.models.find((model) => model.name === "Shared");
        const start = sdkContext.sdkPackage.clients[0].methods.find(
          (method) => method.name === "begin",
        );
        ok(sharedModel);
        ok(start?.kind === "lro");
        ok(start.lroMetadata.statusMetadata?.[0]);
        start.lroMetadata.statusMetadata[0].property.type = sharedModel.properties[0].type;
      }
      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(
        diagnostics.map((diagnostic) => diagnostic.code),
        [],
      );
      const method = root.clients[0].methods.find((method) => method.name === "begin");
      ok(method?.kind === "lro");
      const selected = method.lroMetadata.statusMetadata?.[0].property.type;
      const shared = root.models.find((model) => model.name === "Shared")?.properties[0].type;
      ok(selected?.kind === "enum");
      ok(selected.usage & UsageFlags.Output);
      ok(shared);
      strictEqual(shared.kind, optional ? "enum" : "constant");
      if (shared.kind === "enum") {
        strictEqual(shared.name, "SharedValue");
        ok(shared.usage & UsageFlags.Input);
        strictEqual(selected === shared, shareSdkType);
      }
      strictEqual(root.enums.includes(selected), true);
    },
  );

  it.each([
    {
      decorators: '@pollingLocation @header("Operation-Location")',
      expectedLocation: "ResponseHeader",
      expectedName: "Operation-Location",
    },
    {
      decorators: "@pollingLocation",
      expectedLocation: "ResponseBody",
      expectedName: "status_url",
    },
    {
      decorators: "@pollingLocation @body",
      expectedLocation: "Self",
      expectedName: undefined,
    },
    {
      decorators: "@pollingLocation @bodyRoot",
      expectedLocation: "Self",
      expectedName: undefined,
    },
  ])(
    "preserves a polling link in $expectedLocation without changing its source property",
    async ({ decorators, expectedLocation, expectedName }) => {
      const program = await typeSpecCompile(
        `
        namespace Tracking {
          model Monitor {
            @lroStatus status: "Running" | "Succeeded" | "Failed" | "Canceled";
            @lroResult result?: string;
          }
        }
        namespace Kickoff {
          model StartResponse {
            @statusCode code: 202;
            ${decorators}
            @encodedName("application/json", "status_url")
            location: ResourceLocation<Tracking.Monitor>;
          }
        }
        @get @route("/jobs/{jobId}/status")
        op getStatus(@lroOperationId @path("jobId") id: string): Tracking.Monitor;
        @put @route("/jobs/{jobId}/status")
        @useFinalStateVia("original-uri")
        @pollingOperation(getStatus)
        op begin(@path("jobId") id: string): Kickoff.StartResponse;
        `,
        runner,
        { IsAzureCoreNeeded: true, IsTCGCNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const sdkMethod = sdkContext.sdkPackage.clients[0].methods.find((m) => m.name === "begin");
      ok(sdkMethod?.kind === "lro");
      const sdkPath = sdkMethod.lroMetadata.operationId?.find((entry) => entry.kind === "path");
      ok(sdkPath?.kind === "path");

      const [root, diagnostics] = createModel(sdkContext);
      deepStrictEqual(diagnostics, []);
      const method = root.clients[0].methods.find((m) => m.name === "begin");
      ok(method?.kind === "lro");
      const path = method.lroMetadata.operationId?.find((entry) => entry.kind === "path");
      ok(path?.kind === "path");
      strictEqual(path.source.location, expectedLocation);
      strictEqual(path.source.property.serializedName, expectedName);
      const cachedSource = sdkContext.__typeCache.properties.get(sdkPath.source.property);
      ok(cachedSource);
      strictEqual(
        cachedSource.serializedName,
        sdkPath.source.property.serializationOptions.json?.name ??
          sdkPath.source.property.serializationOptions.xml?.name ??
          sdkPath.source.property.serializationOptions.multipart?.name,
      );
      if (expectedLocation === "ResponseHeader") {
        notStrictEqual(path.source.property, cachedSource);
      } else {
        strictEqual(path.source.property, cachedSource);
      }
    },
  );

  it.each([undefined, "", 'Use "read" instead.\nSee C:\\sdk.'])(
    "preserves operation deprecation metadata: %s",
    async (message) => {
      const program = await typeSpecCompile(
        `${message === undefined ? "" : `#deprecated ${JSON.stringify(message)}`}
         @get op legacy(): string;`,
        runner,
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root] = createModel(sdkContext);
      strictEqual(root.clients[0].methods[0].operation.deprecated, message);
      const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
      strictEqual(serialized.clients[0].methods[0].operation.deprecated, message);
    },
  );

  it.each([
    { start: 200, end: 299 },
    { start: 204, end: 204 },
  ])("preserves exactly the $start-$end response status range", async ({ start, end }) => {
    const program = await typeSpecCompile(
      `
        model RangedResponse {
          @statusCode @minValue(${start}) @maxValue(${end})
          code: int32;
        }
        @get op read(): RangedResponse;
      `,
      runner,
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root] = createModel(sdkContext);
    const responses = root.clients[0].methods[0].operation.responses;
    const expected = Array.from({ length: end - start + 1 }, (_, index) => start + index);

    strictEqual(responses.length, 1);
    deepStrictEqual(responses[0].statusCodes, expected);
    const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
    deepStrictEqual(serialized.clients[0].methods[0].operation.responses[0].statusCodes, expected);
  });

  it.each([
    { decorator: "@responseAsBool", enabled: true },
    { decorator: '@responseAsBool("csharp")', enabled: true },
    { decorator: '@responseAsBool("java")', enabled: false },
    { decorator: "", enabled: false },
  ])("preserves HEAD response-as-bool metadata for $decorator", async ({ decorator, enabled }) => {
    const program = await typeSpecCompile(
      `
        ${decorator}
        @head op exists(): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods[0];
    const serialized = JSON.parse(serializeCodeModel(sdkContext, root));
    const operation = serialized.clients[0].methods[0].operation;

    strictEqual(operation.responseAsBool, enabled ? true : undefined);
    strictEqual(method.response.type?.kind, enabled ? "boolean" : undefined);
    deepStrictEqual(
      method.operation.responses.flatMap((response) => response.statusCodes),
      enabled ? [204, 404] : [204],
    );
    ok(method.operation.responses.every((response) => response.bodyType === undefined));
  });

  it.each([
    {
      scope: "namespace",
      code: `@get @route("/widgets") op getWidget(): string;`,
      path: "/widgets",
    },
    {
      scope: "interface",
      code: `interface Widgets {
        @get @route("/widgets") getWidget(): string;
      }`,
      path: "/widgets",
    },
    {
      scope: "REST resource",
      code: `
        @resource("widgets")
        model Widget {
          @key id: string;
        }
        @readsResource(Widget)
        @get @route("/widgets/{id}")
        op getWidget(@path id: string): Widget;
      `,
      path: "/widgets/{id}",
    },
  ])(
    "omits resourceName for $scope operations and serialized code models",
    async ({ code, path }) => {
      const program = await typeSpecCompile(code, runner);
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const [root] = createModel(sdkContext);
      strictEqual(root.clients.length, 1);
      const client = root.clients[0];
      const methods = [
        ...client.methods,
        ...(client.children ?? []).flatMap((child) => child.methods),
      ];

      strictEqual(methods.length, 1);
      const operation = methods[0].operation;
      ok(operation);
      strictEqual(operation.name, "getWidget");
      strictEqual(operation.httpMethod, "GET");
      strictEqual(operation.path, path);
      strictEqual("resourceName" in operation, false);
      strictEqual(serializeCodeModel(sdkContext, root).includes('"resourceName"'), false);
    },
  );

  describe("Operation with embedded non-body parameters in request body", () => {
    describe("With header in request model", () => {
      it("Header parameter in model should not be present in service method", async () => {
        const program = await typeSpecCompile(
          `
            model HeaderModel {
                @header("x-foo")
                foo: string;
    
                bar: int32;
            }
    
            op testOperation(@header p1: string, @bodyRoot options: HeaderModel): void;
            `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        // validate service method
        const method = root.clients[0].methods[0];
        ok(method);
        strictEqual(method.parameters.length, 3);

        const p1 = method.parameters.find((p) => p.name === "p1");
        ok(p1);
        strictEqual(p1.location, RequestLocation.Header);

        const headerModel = method.parameters.find((p) => p.name === "options");
        ok(headerModel);
        strictEqual(headerModel.location, RequestLocation.Body);
        strictEqual(headerModel.type.kind, "model");
        strictEqual(headerModel.type.name, "HeaderModel");

        const fooParam = method.parameters.find((p) => p.name === "foo");
        strictEqual(fooParam, undefined);

        // validate operation
        const operation = root.clients[0].methods[0].operation;
        ok(operation);
        strictEqual("resourceName" in operation, false);
        strictEqual(operation.parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.name, "contentType");
        strictEqual(contentTypeParam.type.kind, "constant");

        // body parameter
        const bodyParam = operation.parameters.find((p) => p.name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.type.kind, "model");
        strictEqual(bodyParam.kind, "body");

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.kind, "header");

        // header parameter in service method
        const headerParam2 = operation.parameters.find((p) => p.name === "p1");
        ok(headerParam2);
        strictEqual(headerParam2.type.kind, "string");
        strictEqual(headerParam2.kind, "header");
      });
    });

    describe("With query in request model", () => {
      it("Query parameter in model should not be present in service method", async () => {
        const program = await typeSpecCompile(
          `
            model HeaderModel {
                @query("x-foo")
                foo: string;
    
                bar: int32;
            }
    
            op testOperation(@header p1: string, @bodyRoot options: HeaderModel): void;
            `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        // validate service method
        const method = root.clients[0].methods[0];
        ok(method);
        strictEqual(method.parameters.length, 3);

        const p1 = method.parameters.find((p) => p.name === "p1");
        ok(p1);
        strictEqual(p1.location, RequestLocation.Header);

        const headerModel = method.parameters.find((p) => p.name === "options");
        ok(headerModel);
        strictEqual(headerModel.location, RequestLocation.Body);
        strictEqual(headerModel.type.kind, "model");
        strictEqual(headerModel.type.name, "HeaderModel");

        // header parameter in service method
        const fooParam = method.parameters.find((p) => p.name === "foo");
        strictEqual(fooParam, undefined);

        // validate operation
        const operation = root.clients[0].methods[0].operation;
        ok(operation);
        strictEqual(operation.parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.name, "contentType");
        strictEqual(contentTypeParam.type.kind, "constant");

        // body parameter
        const bodyParam = operation.parameters.find((p) => p.name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.type.kind, "model");
        strictEqual(bodyParam.kind, "body");

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.kind, "query");
      });
    });
  });

  describe("Operation with response headers", () => {
    describe("With header in response model", () => {
      it("should have a response body type of model with the header as a property", async () => {
        const program = await typeSpecCompile(
          `
          model ModelWithHeaderInResponse {
  
          @header("x-foo")
          foo: string;
  
          bar: int32;
      }
  
      @route("/test")
      op operationWithResponse(): ModelWithHeaderInResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const operation = root.clients[0].methods[0].operation;
        ok(operation);

        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);

        // validate headers
        strictEqual(response.headers.length, 1);
        strictEqual(response.headers[0].name, "foo");
        strictEqual(response.headers[0].nameInResponse, "x-foo");
        strictEqual(response.headers[0].type.kind, "string");

        // validate response body
        strictEqual(response.bodyType?.kind, "model");

        // validate model properties
        const body = response.bodyType;
        ok(body);
        // header property
        strictEqual(body.properties.length, 2);
        strictEqual(body.properties[0].name, "foo");
        strictEqual(body.properties[0].type.kind, "string");
        strictEqual(body.properties[0].kind, "property");
        // body property
        strictEqual(body.properties[1].name, "bar");
        strictEqual(body.properties[1].type.kind, "int32");
        strictEqual(body.properties[1].kind, "property");
      });
    });
  });

  describe("Operation response type conversion", () => {
    it("preserves JSONL stream item types", async () => {
      const program = await typeSpecCompile(
        `
          model Info {
            desc: string;
          }

          @post op send(stream: JsonlStream<Info>): void;
          op receive(): JsonlStream<Info>;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const [root] = createModel(sdkContext);

      const send = root.clients[0].methods.find((method) => method.name === "send");
      ok(send);
      const sendParameter = send.parameters.find((parameter) => parameter.name === "stream");
      ok(sendParameter);
      ok(sendParameter.type.kind === "streaming");
      ok(sendParameter.type.valueType.kind === "model");
      strictEqual(sendParameter.type.valueType.name, "Info");

      const bodyParameter = send.operation.parameters.find(
        (parameter) => parameter.kind === "body",
      );
      ok(bodyParameter);
      ok(bodyParameter.type.kind === "streaming");
      ok(bodyParameter.type.valueType.kind === "model");
      strictEqual(bodyParameter.type.valueType.name, "Info");

      const receive = root.clients[0].methods.find((method) => method.name === "receive");
      ok(receive);
      ok(receive.response.type?.kind === "streaming");
      ok(receive.response.type.valueType.kind === "model");
      strictEqual(receive.response.type.valueType.name, "Info");
      ok(receive.operation.responses[0].bodyType?.kind === "streaming");
      ok(receive.operation.responses[0].bodyType.valueType.kind === "model");
      strictEqual(receive.operation.responses[0].bodyType.valueType.name, "Info");
      strictEqual(receive.operation.bufferResponse, false);
    });

    it("preserves SSE event unions and terminal events", async () => {
      const program = await typeSpecCompile(
        `
          model ResponseCreated {
            id: string;
          }

          model ResponseDelta {
            delta: string;
          }

          @events
          union ResponseEvents {
            @Events.contentType("application/json")
            responseCreated: ResponseCreated,

            @Events.contentType("application/json")
            responseDelta: ResponseDelta,

            @Events.contentType("text/plain")
            @terminalEvent
            "[DONE]",
          }

          op receive(): SSEStream<ResponseEvents>;
        `,
        runner,
        { IsSseNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const [root] = createModel(sdkContext);

      const receive = root.clients[0].methods.find((method) => method.name === "receive");
      ok(receive);
      ok(receive.response.type?.kind === "streaming");
      strictEqual(receive.response.type.streamKind, "sse");
      ok(receive.response.type.valueType.kind === "union");
      strictEqual(receive.response.type.valueType.name, "ResponseEvents");
      strictEqual(receive.response.type.terminalEventType, undefined);
      strictEqual(receive.response.type.terminalEventValue, "[DONE]");
      ok(receive.operation.responses[0].bodyType?.kind === "streaming");
      strictEqual(receive.operation.responses[0].bodyType.streamKind, "sse");
      strictEqual(receive.operation.bufferResponse, false);
    });

    describe("With anonymous union enum response type", () => {
      it("should convert anonymous union enum response type to value type", async () => {
        const program = await typeSpecCompile(
          `
          @route("/test")
          op operationWithUnionEnumResponse(): "option1" | "option2" | string;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type?.kind, "string");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "string");
      });
    });

    describe("With named union enum response type", () => {
      it("should preserve the named enum response type", async () => {
        const program = await typeSpecCompile(
          `
          union UnionEnumResponse {
            value1: "option1",
            value2: "option2",
            stringValue: string,
          }

          @route("/test")
          op operationWithUnionEnumResponse(): UnionEnumResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response - named union enum is preserved as enum
        strictEqual(method.response.type?.kind, "enum");
        strictEqual((method.response.type as InputEnumType).name, "UnionEnumResponse");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "enum");
      });
    });

    describe("With union model response type", () => {
      it("should use union response type", async () => {
        const program = await typeSpecCompile(
          `
          model ServerEventSessionAvatarConnecting {
            server_sdp: string;
          }

          model ServerEventSessionCreated {
            session: string;
          }

          alias ForceModelServerEvent =
            ServerEventSessionAvatarConnecting |
            ServerEventSessionCreated;

          @route("foo")
          op force_models(): ForceModelServerEvent;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        const responseType = method.response.type;
        ok(responseType);
        strictEqual(responseType.kind, "union");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "union");
      });
    });

    describe("With regular enum response type", () => {
      it("should convert regular enum response type normally", async () => {
        const program = await typeSpecCompile(
          `
          enum RegularEnumResponse {
            value1: "option1",
            value2: "option2",
          }

          @route("/test")
          op operationWithRegularEnumResponse(): RegularEnumResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type?.kind, "enum");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "enum");
      });
    });

    describe("With undefined response type", () => {
      it("should handle undefined response type", async () => {
        const program = await typeSpecCompile(
          `
          @route("/test")
          op operationWithVoidResponse(): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type, undefined);

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType, undefined);
      });
    });

    describe("Optional Content-Type header", () => {
      it("Optional body should have Content-Type remain as Constant (not transformed to enum)", async () => {
        const program = await typeSpecCompile(
          `
          model BodyModel {
            name: string;
          }
          
          @post
          op withOptionalBody(@body body?: BodyModel): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        const contentTypeMethodParam = method.parameters.find((p) => p.name === "contentType");
        ok(contentTypeMethodParam, "Content-Type parameter should exist in service method");
        strictEqual(
          contentTypeMethodParam.type.kind,
          "constant",
          "Content-type should remain a constant type, not transformed to enum",
        );

        // validate operation
        const operation = method.operation;
        ok(operation);

        // Find Content-Type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam, "Content-Type parameter should exist");
        strictEqual(contentTypeParam.kind, "header");
        strictEqual(contentTypeParam.serializedName, "Content-Type");
        strictEqual(contentTypeParam.optional, true, "Content-Type should be optional");
        strictEqual(
          contentTypeParam.scope,
          "Constant",
          "Content-Type should remain Constant scope",
        );
        strictEqual(
          contentTypeParam.type.kind,
          "constant",
          "Content-Type should remain a constant type, not transformed to enum",
        );
      });

      it("Required body should have Content-Type with Constant scope", async () => {
        const program = await typeSpecCompile(
          `
          model BodyModel {
            name: string;
          }
          
          @post
          op withRequiredBody(@body body: BodyModel): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate operation
        const operation = method.operation;
        ok(operation);

        // Find Content-Type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam, "Content-Type parameter should exist");
        strictEqual(contentTypeParam.kind, "header");
        strictEqual(contentTypeParam.serializedName, "Content-Type");
        strictEqual(contentTypeParam.optional, false, "Content-Type should be required");
        strictEqual(
          contentTypeParam.scope,
          "Constant",
          "Content-Type should have Constant scope for required body",
        );
        strictEqual(
          contentTypeParam.type.kind,
          "constant",
          "Content-Type should be a constant type",
        );
      });
    });
  });
});

describe("Test isExactName propagation on operations and parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("propagates isExactName from @clientName decorator with exact() on a method parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@clientName(Azure.ClientGenerator.Core.exact("snake_case_param"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const methodParams = root.clients[0].methods[0].parameters;
    const param = methodParams.find((p) => p.name === "snake_case_param");
    ok(param);
    strictEqual(param.kind, "method");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a query parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@query @clientName(Azure.ClientGenerator.Core.exact("snake_case_query"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_query");
    ok(param);
    strictEqual(param.kind, "query");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a header parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@header @clientName(Azure.ClientGenerator.Core.exact("snake_case_header"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_header");
    ok(param);
    strictEqual(param.kind, "header");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a path parameter", async () => {
    const program = await typeSpecCompile(
      `
        @route("/{regularName}")
        op test(@path @clientName(Azure.ClientGenerator.Core.exact("snake_case_path"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_path");
    ok(param);
    strictEqual(param.kind, "path");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a body parameter", async () => {
    const program = await typeSpecCompile(
      `
        model Book {
          name: string;
        }
        op test(@body @clientName(Azure.ClientGenerator.Core.exact("snake_case_body"), "csharp") regularName: Book): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const bodyParam = root.clients[0].methods[0].operation.parameters.find(
      (p) => p.name === "snake_case_body",
    );
    ok(bodyParam);
    strictEqual(bodyParam.kind, "body");
    strictEqual(bodyParam.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on an operation", async () => {
    const program = await typeSpecCompile(
      `
        @clientName(Azure.ClientGenerator.Core.exact("snake_case_op"), "csharp")
        op test(): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods.find((m) => m.name === "snake_case_op");
    ok(method);
    strictEqual(method.isExactName, true);
    strictEqual(method.operation.name, "snake_case_op");
    strictEqual(method.operation.isExactName, true);
  });
});

describe("Multipart convenience method generation", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("disables convenience method for multipart/mixed and reports a diagnostic", async () => {
    const program = await typeSpecCompile(
      `
        model MultipartRequest {
          id: HttpPart<string>;
          profileImage: HttpPart<File>;
        }

        @post
        @route("/upload")
        op upload(
          @header contentType: "multipart/mixed",
          @multipartBody body: MultipartRequest,
        ): NoContentResponse;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, diagnostics] = createModel(sdkContext);

    const operation = root.clients[0].methods[0].operation;
    ok(operation);
    ok(operation.requestMediaTypes?.includes("multipart/mixed"));
    // Protocol methods are still generated, but convenience methods are turned off.
    strictEqual(operation.generateProtocolMethod, true);
    strictEqual(operation.generateConvenienceMethod, false);

    const diagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-multipart-convenience-method",
    );
    ok(diagnostic);
    strictEqual(diagnostic.severity, "warning");
  });

  it("keeps convenience method for multipart/form-data without a diagnostic", async () => {
    const program = await typeSpecCompile(
      `
        model MultipartRequest {
          profileImage: HttpPart<File>;
        }

        @post
        @route("/upload")
        op upload(
          @header contentType: "multipart/form-data",
          @multipartBody body: MultipartRequest,
        ): NoContentResponse;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, diagnostics] = createModel(sdkContext);

    const operation = root.clients[0].methods[0].operation;
    ok(operation);
    ok(operation.requestMediaTypes?.includes("multipart/form-data"));
    strictEqual(operation.generateConvenienceMethod, true);

    const diagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-multipart-convenience-method",
    );
    strictEqual(diagnostic, undefined);
  });
});
