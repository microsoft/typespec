import { expectDiagnosticEmpty, expectDiagnostics, t } from "@typespec/compiler/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as httpProperty from "../src/http-property.js";
import { Visibility } from "../src/metadata.js";
import { HttpPayloadDisposition, resolveHttpPayload } from "../src/payload.js";
import { Tester } from "./test-host.js";

afterEach(() => vi.restoreAllMocks());

describe("implicit body property filtering", () => {
  it.each([
    HttpPayloadDisposition.Request,
    HttpPayloadDisposition.Response,
    HttpPayloadDisposition.Multipart,
  ])("preserves an entirely unannotated model for disposition %s", async (disposition) => {
    const { program, Payload } = await Tester.compile(t.code`
      model ${t.model("Payload")} {
        first: string;
        second?: int32;
        third: boolean;
      }
    `);

    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      Visibility.All,
      disposition,
    );

    expectDiagnosticEmpty(diagnostics);
    expect(payload.body?.type).toBe(Payload);
    expect([...Payload.properties.keys()]).toEqual(["first", "second", "third"]);
    expect(Payload.properties.get("second")?.optional).toBe(true);
  });

  it.each([
    [HttpPayloadDisposition.Request, ["status", "value", "optional"]],
    [HttpPayloadDisposition.Response, ["path", "query", "value", "optional"]],
    [HttpPayloadDisposition.Multipart, ["path", "query", "status", "value", "optional"]],
  ] as const)("filters metadata for disposition %s", async (disposition, names) => {
    const { program, Payload } = await Tester.compile(t.code`
      model ${t.model("Payload")} {
        @header header: string;
        @header contentType: "application/json";
        @path path: string;
        @query query: string;
        @statusCode status: 200;
        @bodyIgnore ignored: string;
        value: string;
        optional?: int32;
      }
    `);

    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      Visibility.All,
      disposition,
    );

    expectDiagnosticEmpty(diagnostics);
    expect(payload.body?.contentTypes).toEqual(["application/json"]);
    expect(payload.body?.type.kind).toBe("Model");
    if (payload.body?.type.kind !== "Model") {
      throw new Error("Expected a model body");
    }
    expect([...payload.body.type.properties.keys()]).toEqual(names);
    expect(payload.body.type.properties.get("optional")?.optional).toBe(true);
    for (const name of names) {
      expect(payload.body.type.properties.get(name)?.sourceProperty).toBe(
        Payload.properties.get(name),
      );
    }
    expect(Payload.properties.size).toBe(8);
  });

  it.each([
    [Visibility.Create, "writeOnly"],
    [Visibility.Read, "readOnly"],
  ] as const)("excludes invisible properties for visibility %s", async (visibility, name) => {
    const { program, Payload } = await Tester.compile(t.code`
      model ${t.model("Payload")} {
        @visibility(Lifecycle.Create) writeOnly: string;
        @visibility(Lifecycle.Read) readOnly: string;
        shared: string;
      }
    `);

    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      visibility,
      HttpPayloadDisposition.Request,
    );

    expectDiagnosticEmpty(diagnostics);
    expect(payload.body?.type.kind).toBe("Model");
    if (payload.body?.type.kind !== "Model") {
      throw new Error("Expected a model body");
    }
    expect([...payload.body.type.properties.keys()]).toEqual([name, "shared"]);
  });

  it("matches property identity rather than a nested property's name", async () => {
    const { program, Payload } = await Tester.compile(t.code`
      model ${t.model("Payload")} {
        @header id: string;
        nested: { id: string };
        value: string;
      }
    `);

    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      Visibility.All,
      HttpPayloadDisposition.Request,
    );

    expectDiagnosticEmpty(diagnostics);
    expect(payload.body?.type.kind).toBe("Model");
    if (payload.body?.type.kind !== "Model") {
      throw new Error("Expected a model body");
    }
    expect([...payload.body.type.properties.keys()]).toEqual(["nested", "value"]);
    expect(payload.body.type.properties.get("nested")?.type).toBe(
      Payload.properties.get("nested")?.type,
    );
  });

  it.each(["", "@header header: string;", "@bodyIgnore ignored: string;"])(
    "does not create a body for %j",
    async (properties) => {
      const { program, Payload } = await Tester.compile(
        t.code`model ${t.model("Payload")} { ${properties} }`,
      );
      const [payload, diagnostics] = resolveHttpPayload(
        program,
        Payload,
        Visibility.All,
        HttpPayloadDisposition.Request,
      );

      expectDiagnosticEmpty(diagnostics);
      expect(payload.body).toBeUndefined();
    },
  );

  it("preserves an explicit body when all other properties are metadata", async () => {
    const { program, Payload } = await Tester.compile(t.code`
      model ${t.model("Payload")} {
        @header header: string;
        @body data: { value: string };
      }
    `);
    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      Visibility.All,
      HttpPayloadDisposition.Request,
    );

    expectDiagnosticEmpty(diagnostics);
    expect(payload.body?.type).toBe(Payload.properties.get("data")?.type);
    expect(payload.body?.property).toBe(Payload.properties.get("data"));
  });

  it("still diagnoses inherited unannotated properties alongside an explicit body", async () => {
    const { program, Payload } = await Tester.compile(t.code`
      model Base { value: string; }
      model ${t.model("Payload")} extends Base {
        @header header: string;
        @body data: { value: string };
      }
    `);
    const [payload, diagnostics] = resolveHttpPayload(
      program,
      Payload,
      Visibility.All,
      HttpPayloadDisposition.Request,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/http/duplicate-body",
      message:
        "Operation has a @body and an unannotated parameter. There can only be one representing the body",
    });
    expect(payload.body?.type).toBe(Payload.properties.get("data")?.type);
  });

  it.each([8, 16])(
    "reads metadata properties a linear number of times for %s body properties",
    async (count) => {
      const { program, Payload } = await Tester.compile(t.code`
        model ${t.model("Payload")} {
          ${Array.from({ length: count }, (_, i) => `p${i}: string;`).join("\n")}
        }
      `);
      const resolvePayloadProperties = httpProperty.resolvePayloadProperties;
      let propertyReads = 0;
      vi.spyOn(httpProperty, "resolvePayloadProperties").mockImplementationOnce((...args) => {
        const [metadata, diagnostics] = resolvePayloadProperties(...args);
        return [
          metadata.map((entry) => ({
            ...entry,
            get property() {
              propertyReads++;
              return entry.property;
            },
          })),
          diagnostics,
        ];
      });

      const [payload, diagnostics] = resolveHttpPayload(
        program,
        Payload,
        Visibility.All,
        HttpPayloadDisposition.Request,
      );

      expectDiagnosticEmpty(diagnostics);
      expect(payload.body?.type).toBe(Payload);
      expect(propertyReads).toBeGreaterThan(0);
      expect(propertyReads).toBeLessThanOrEqual(count * 4);
    },
  );
});
