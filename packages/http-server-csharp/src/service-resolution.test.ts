import { Tester } from "#test/tester.js";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";
import { beforeEach, expect, it, vi } from "vitest";
import { resolveServiceTypes, type ServiceTypeResolution } from "./service-resolution.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

async function resolve(code: string): Promise<ServiceTypeResolution> {
  await runner.compile(code);
  const tk = $(runner.program);
  return resolveServiceTypes(runner.program, tk, new HttpCanonicalizer(tk));
}

it("excludes models declared outside the service namespace that are not referenced", async () => {
  const resolution = await resolve(`
    namespace Other {
      model Used { name: string; }
      model Unused { name: string; }
    }

    @service
    namespace Contoso {
      model Widget { id: string; used: Other.Used; }
      op read(): Widget;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Used", "Widget"]);
});

it("uses the declared service namespace instead of imported namespaces with content", async () => {
  const resolution = await resolve(`
    namespace Azure.ClientGenerator.Core {
      model ClientOptions {}
      enum Usage { input, output }
    }

    @service
    namespace Azure.AI.Projects {
      model Widget { id: string; }
      op read(): Widget;
    }
  `);

  expect(resolution.serviceNamespace?.name).toBe("Projects");
  expect(resolution.serviceNamespaceName).toBe("Azure.Ai.Projects");
  expect(resolution.models.map((m) => m.name)).toEqual(["Widget"]);
});

it("excludes enums and union enums declared outside the service namespace that are not referenced", async () => {
  const resolution = await resolve(`
    namespace Other {
      enum UsedEnum { red, blue }
      enum UnusedEnum { up, down }
      union UsedUnion { "on", "off" }
      union UnusedUnion { "left", "right" }
    }

    @service
    namespace Contoso {
      model Widget { color: Other.UsedEnum; state: Other.UsedUnion; }
      op read(): Widget;
    }
  `);

  expect(resolution.enums.map((e) => e.name)).toEqual(["UsedEnum"]);
  expect(resolution.unionEnums.map((u) => u.name)).toEqual(["UsedUnion"]);
});

it("discovers types referenced transitively by an operation", async () => {
  const resolution = await resolve(`
    namespace Other {
      model Envelope { detail: Detail; }
      model Detail { kind: Kind; }
      enum Kind { simple, complex }
      model Untouched { name: string; }
    }

    @service
    namespace Contoso {
      op read(): Other.Envelope;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Detail", "Envelope"]);
  expect(resolution.enums.map((e) => e.name)).toEqual(["Kind"]);
});

it("does not create interfaces for operations declared outside the service namespace", async () => {
  const resolution = await resolve(`
    namespace Other {
      interface OtherOps {
        @route("/other") otherRead(): void;
      }
    }

    @service
    namespace Contoso {
      interface Widgets {
        @route("/widgets") read(): void;
      }
    }
  `);

  expect(resolution.interfaces.map((i) => i.name)).toEqual(["Widgets"]);
});

it("does not emit template arguments that the instantiation never exposes", async () => {
  const resolution = await resolve(`
    namespace Other {
      model Trait { detail: TraitDetail; }
      model TraitDetail { name: string; }
      model Envelope<Item, Traits> { items: Item[]; }
    }

    @service
    namespace Contoso {
      model Widget { id: string; }
      op read(): Other.Envelope<Widget, Other.Trait>;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Envelope", "Widget"]);
});

it("tracks the exact source operation for each canonical operation", async () => {
  const { read } = await runner.compile(t.code`
    @service
    namespace Contoso {
      interface ${t.interface("PetStore")} {
        @route("/pets/{id}") @get ${t.op("read")}(
          @path id: string,
          @query apiVersion?: string,
        ): string;
      }
    }
  `);
  const tk = $(runner.program);
  const resolution = resolveServiceTypes(runner.program, tk, new HttpCanonicalizer(tk));
  const canonicalOperation = [...resolution.canonicalOperationSourceMap].find(
    ([, sourceOperation]) => sourceOperation === read,
  )?.[0];

  expect(canonicalOperation).toBeDefined();
  expect(resolution.canonicalOperationSourceMap.get(canonicalOperation!)).toBe(read);
  expect([...resolution.canonicalOpsMap.values()].flat()).toContain(canonicalOperation);
});

it("skips operation canonicalization when it is disabled", async () => {
  await runner.compile(`
    @service
    namespace Contoso {
      model Widget { id: string; }
      op read(): Widget;
    }
  `);
  const tk = $(runner.program);
  const canonicalizer = new HttpCanonicalizer(tk);
  const canonicalize = vi.spyOn(canonicalizer, "canonicalize");

  const resolution = resolveServiceTypes(runner.program, tk, canonicalizer, {
    canonicalizeOperations: false,
  });

  expect(resolution.models.map((m) => m.name)).toContain("Widget");
  expect(resolution.interfaces).toHaveLength(1);
  expect(resolution.canonicalOpsMap).toEqual(new Map());
  expect(resolution.canonicalOperationSourceMap).toEqual(new Map());
  expect(canonicalize).not.toHaveBeenCalled();
});

it("discovers the payload type of an HttpPart", async () => {
  const resolution = await resolve(`
    namespace Other {
      model Payload { name: string; }
    }

    @service
    namespace Contoso {
      model Form { part: HttpPart<Other.Payload>; }
      @post op upload(@multipartBody body: Form): void;
    }
  `);

  expect(resolution.models.map((m) => m.name)).toContain("Payload");
  expect(resolution.models.map((m) => m.name)).not.toContain("HttpPart");
});

it("emits every namespace when no service is declared", async () => {
  const resolution = await resolve(`
    namespace Other {
      model Standalone { name: string; }
    }

    namespace Contoso {
      model Widget { id: string; }
      op read(): Widget;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Standalone", "Widget"]);
});
