import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { getContentTypes } from "@typespec/http";
import { getStreamOf } from "@typespec/streams";
import { describe, expect, it } from "vitest";
import { Tester } from "./test-host.js";

describe("SSEStream", () => {
  it("sets streamOf, contentType ('text/event-stream'), and body", async () => {
    const { Foo, TestEvents, program } = await Tester.compile(t.code`
      @events
      union ${t.union("TestEvents")} { 
        foo: string,

        bar: string,
      }

      model ${t.model("Foo")} is SSEStream<TestEvents>;
    `);
    expect(getStreamOf(program, Foo)).toBe(TestEvents);
    expect(getContentTypes(Foo.properties.get("contentType")!)[0]).toEqual(["text/event-stream"]);
    expect(Foo.properties.get("body")!.type).toMatchObject({
      kind: "Scalar",
      name: "string",
    });
  });

  it("should fail when union is not decorated with @events", async () => {
    const diagnostics = await Tester.diagnose(`
      model UserConnect {
        name: string;
      }

      union BasicUnion {
        userconnect: UserConnect,
      }

      op subscribe(): SSEStream<BasicUnion>;
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/sse/sse-stream-union-not-events",
      severity: "error",
    });
  });

  it("should pass when union is decorated with @events", async () => {
    const diagnostics = await Tester.diagnose(`
      model UserConnect {
        name: string;
      }

      @events
      union BasicUnion {
        userconnect: UserConnect,
      }

      op subscribe(): SSEStream<BasicUnion>;
    `);

    expectDiagnostics(diagnostics, []);
  });

  it("should fail when HttpStream with text/event-stream is used without @events", async () => {
    const diagnostics = await Tester.diagnose(`
      model UserConnect {
        name: string;
      }

      union BasicUnion {
        userconnect: UserConnect,
      }

      model MyStream is Http.Streams.HttpStream<BasicUnion, "text/event-stream">;
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/sse/sse-stream-union-not-events",
      severity: "error",
    });
  });

  it("should fail when HttpStream with text/event-stream is a model", async () => {
    const diagnostics = await Tester.diagnose(`
      model UserConnect {
        name: string;
      }

      model MyStream is Http.Streams.HttpStream<UserConnect, "text/event-stream">;
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/sse/sse-stream-union-not-events",
      severity: "error",
    });
  });

  it("should fail when SSEStream is used with a model", async () => {
    const diagnostics = await Tester.diagnose(`
      model UserConnect {
        name: string;
      }

      model MyStream is SSEStream<UserConnect>;
    `);

    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
      severity: "error",
    });
  });
});
