import { Tester } from "#test/tester.js";
import type { TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";
import { beforeEach, expect, it } from "vitest";
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
    namespace Library {
      model Used { name: string; }
      model Unused { name: string; }
    }

    @service
    namespace Contoso {
      model Widget { id: string; used: Library.Used; }
      op read(): Widget;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Used", "Widget"]);
});

it("excludes enums and union enums declared outside the service namespace that are not referenced", async () => {
  const resolution = await resolve(`
    namespace Library {
      enum UsedEnum { red, blue }
      enum UnusedEnum { up, down }
      union UsedUnion { "on", "off" }
      union UnusedUnion { "left", "right" }
    }

    @service
    namespace Contoso {
      model Widget { color: Library.UsedEnum; state: Library.UsedUnion; }
      op read(): Widget;
    }
  `);

  expect(resolution.enums.map((e) => e.name)).toEqual(["UsedEnum"]);
  expect(resolution.unionEnums.map((u) => u.name)).toEqual(["UsedUnion"]);
});

it("discovers types referenced transitively through operations only", async () => {
  const resolution = await resolve(`
    namespace Library {
      model Envelope { detail: Detail; }
      model Detail { kind: Kind; }
      enum Kind { simple, complex }
      model Untouched { name: string; }
    }

    @service
    namespace Contoso {
      op read(): Library.Envelope;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Detail", "Envelope"]);
  expect(resolution.enums.map((e) => e.name)).toEqual(["Kind"]);
});

it("does not create interfaces for operations declared outside the service namespace", async () => {
  const resolution = await resolve(`
    namespace Library {
      interface LibraryOps {
        @route("/lib") libRead(): void;
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

it("emits every user namespace when no service is declared", async () => {
  const resolution = await resolve(`
    namespace Library {
      model Standalone { name: string; }
    }

    namespace Contoso {
      model Widget { id: string; }
      op read(): Widget;
    }
  `);

  expect(resolution.models.map((m) => m.name).sort()).toEqual(["Standalone", "Widget"]);
});
