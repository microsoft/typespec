import { expect, it, Mock, vitest } from "vitest";
import {
  CompilerOptions,
  createTypeSpecLibrary,
  Diagnostic,
  TypeSpecLibrary,
  TypeSpecLibraryDef,
} from "../../src/index.js";
import { expectDiagnosticEmpty } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";

interface FakeEmitter {
  name: string;
  $lib: TypeSpecLibrary<any>;
  $onEmit: Mock;
}

function createFakeEmitter(
  name: string,
  extra: Partial<TypeSpecLibraryDef<any>> = {},
): FakeEmitter {
  const $lib = createTypeSpecLibrary({
    name,
    diagnostics: {},
    emitter: {
      options: {
        type: "object",
        properties: {
          "asset-dir": { type: "string", format: "absolute-path", nullable: true },
          "max-files": { type: "number", nullable: true },
        },
        additionalProperties: false,
      },
    },
    ...(extra as any),
  }) as any;
  return { name, $lib, $onEmit: vitest.fn() };
}

async function runEmitters(
  emitters: FakeEmitter[],
  options: CompilerOptions,
): Promise<[undefined, readonly Diagnostic[]]> {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", "model Foo {}");

  for (const emitter of emitters) {
    host.addTypeSpecFile(
      `node_modules/${emitter.name}/package.json`,
      JSON.stringify({
        main: "index.js",
      }),
    );
    host.addJsFile(`node_modules/${emitter.name}/index.js`, {
      $lib: emitter.$lib,
      $onEmit: emitter.$onEmit,
    });
  }
  const diagnostics = await host.diagnose("main.tsp", options);
  return [undefined, diagnostics];
}

async function runEmittersSuccess(
  emitters: FakeEmitter[],
  options: CompilerOptions,
): Promise<void> {
  const [, diagnostics] = await runEmitters(emitters, options);
  expectDiagnosticEmpty(diagnostics);
}

it("calls onEmit for all emitters in emit list", async () => {
  const emitter1 = createFakeEmitter("emitter-1");
  const emitter2 = createFakeEmitter("emitter-2");
  const emitter3 = createFakeEmitter("emitter-3");

  await runEmittersSuccess([emitter1, emitter2, emitter3], {
    emit: [emitter1.name, emitter2.name],
  });

  expect(emitter1.$onEmit).toHaveBeenCalledTimes(1);
  expect(emitter2.$onEmit).toHaveBeenCalledTimes(1);
  expect(emitter3.$onEmit).not.toHaveBeenCalled();
});

it("doesn't call emitters if noEmit is set", async () => {
  const emitter1 = createFakeEmitter("emitter-1");
  const emitter2 = createFakeEmitter("emitter-2");
  const emitter3 = createFakeEmitter("emitter-3");

  await runEmittersSuccess([emitter1, emitter2, emitter3], {
    emit: [emitter1.name, emitter2.name],
    noEmit: true,
  });

  expect(emitter1.$onEmit).not.toHaveBeenCalled();
  expect(emitter2.$onEmit).not.toHaveBeenCalled();
  expect(emitter3.$onEmit).not.toHaveBeenCalled();
});

it("when using dry-run only call emitter with the capabilities", async () => {
  const emitter1 = createFakeEmitter("emitter-1", { capabilities: { dryRun: true } });
  const emitter2 = createFakeEmitter("emitter-2");
  const emitter3 = createFakeEmitter("emitter-3", { capabilities: { dryRun: true } });

  await runEmittersSuccess([emitter1, emitter2, emitter3], {
    emit: [emitter1.name, emitter2.name],
    dryRun: true,
  });

  expect(emitter1.$onEmit).toHaveBeenCalledTimes(1);
  expect(emitter2.$onEmit).not.toHaveBeenCalled();
  expect(emitter3.$onEmit).not.toHaveBeenCalled();
});
