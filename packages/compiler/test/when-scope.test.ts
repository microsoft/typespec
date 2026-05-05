import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import {
  createEmitterScope,
  decoratorMatchesScope,
  getDecoratorsByScope,
} from "../src/core/when-scope.js";
import type { DecoratorApplication, WhenCondition } from "../src/core/types.js";

describe("compiler: when scope system", () => {
  describe("decoratorMatchesScope", () => {
    it("unconditional decorator always matches", () => {
      const dec = createMockDecorator();
      const scope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });
      strictEqual(decoratorMatchesScope(dec, scope), true);
    });

    it("matches emitter condition with correct emitter", () => {
      const dec = createMockDecorator([
        { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
      ]);
      const scope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });
      strictEqual(decoratorMatchesScope(dec, scope), true);
    });

    it("does not match emitter condition with wrong emitter", () => {
      const dec = createMockDecorator([
        { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
      ]);
      const scope = createEmitterScope({ emitter: "@typespec/http-client-python" });
      strictEqual(decoratorMatchesScope(dec, scope), false);
    });

    it("matches language condition", () => {
      const dec = createMockDecorator([{ kind: "language", args: [], rawArgs: ["csharp"] }]);
      const scope = createEmitterScope({ language: "csharp" });
      strictEqual(decoratorMatchesScope(dec, scope), true);
    });

    it("does not match language condition with wrong language", () => {
      const dec = createMockDecorator([{ kind: "language", args: [], rawArgs: ["csharp"] }]);
      const scope = createEmitterScope({ language: "python" });
      strictEqual(decoratorMatchesScope(dec, scope), false);
    });

    it("matches target condition", () => {
      const dec = createMockDecorator([{ kind: "target", args: [], rawArgs: ["client"] }]);
      const scope = createEmitterScope({ target: "client" });
      strictEqual(decoratorMatchesScope(dec, scope), true);
    });

    it("multiple conditions require all to match (AND semantics)", () => {
      const dec = createMockDecorator([
        { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
        { kind: "target", args: [], rawArgs: ["client"] },
      ]);

      // Both match
      strictEqual(
        decoratorMatchesScope(
          dec,
          createEmitterScope({ emitter: "@typespec/http-client-csharp", target: "client" }),
        ),
        true,
      );

      // Only emitter matches
      strictEqual(
        decoratorMatchesScope(
          dec,
          createEmitterScope({ emitter: "@typespec/http-client-csharp", target: "server" }),
        ),
        false,
      );

      // Only target matches
      strictEqual(
        decoratorMatchesScope(
          dec,
          createEmitterScope({ emitter: "@typespec/http-client-python", target: "client" }),
        ),
        false,
      );
    });

    it("does not match when scope is missing required dimension", () => {
      const dec = createMockDecorator([
        { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
      ]);
      // No emitter in scope
      strictEqual(decoratorMatchesScope(dec, createEmitterScope({})), false);
    });

    it("version conditions match for now (POC)", () => {
      const dec = createMockDecorator([{ kind: "since", args: [], rawArgs: ["v2"] }]);
      strictEqual(decoratorMatchesScope(dec, createEmitterScope({})), true);
    });
  });

  describe("getDecoratorsByScope", () => {
    it("returns all unconditional decorators", () => {
      const type = createMockType([createMockDecorator(), createMockDecorator()]);
      const result = getDecoratorsByScope(type, createEmitterScope({}));
      strictEqual(result.length, 2);
    });

    it("filters out decorators that don't match scope", () => {
      const type = createMockType([
        createMockDecorator(), // unconditional
        createMockDecorator([
          { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
        ]),
        createMockDecorator([
          { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-python"] },
        ]),
      ]);

      const csharpScope = createEmitterScope({ emitter: "@typespec/http-client-csharp" });
      const result = getDecoratorsByScope(type, csharpScope);
      strictEqual(result.length, 2); // unconditional + csharp-scoped
    });

    it("returns only unconditional when no scope dimensions match", () => {
      const type = createMockType([
        createMockDecorator(), // unconditional
        createMockDecorator([
          { kind: "emitter", args: [], rawArgs: ["@typespec/http-client-csharp"] },
        ]),
      ]);

      const scope = createEmitterScope({ emitter: "@typespec/http-client-java" });
      const result = getDecoratorsByScope(type, scope);
      strictEqual(result.length, 1); // only unconditional
    });
  });
});

function createMockDecorator(when?: WhenCondition[]): DecoratorApplication {
  return {
    decorator: () => {},
    args: [],
    when,
  };
}

function createMockType(decorators: DecoratorApplication[]) {
  return {
    decorators,
    entityKind: "Type" as const,
    kind: "Model" as const,
    isFinished: true,
  } as any;
}
