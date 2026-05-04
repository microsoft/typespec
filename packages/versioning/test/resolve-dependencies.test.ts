import { expect, it } from "vitest";
import type { VersionResolution } from "../src/index.js";
import { resolveVersions } from "../src/versioning.js";
import { Tester } from "./test-host.js";

async function resolveTimelineMatrix(content: string) {
  const { program } = await Tester.compile(content);

  const serviceNamespace = program.getGlobalNamespaceType().namespaces.get("Test")!;
  const resolutions = resolveVersions(program, serviceNamespace);
  return simplify(resolutions);
}

function simplify(resolutions: VersionResolution[]) {
  return resolutions.map((x) => ({
    root: x.rootVersion?.name,
    libs: Object.fromEntries(
      [...x.versions.entries()]
        .filter((v) => v[0] !== x.rootVersion?.namespace)
        .map((v) => [v[0].name, v[1].name]),
    ),
  }));
}

it("automatically resolve latest version of referenced versioned library", async () => {
  const resolutions = await resolveTimelineMatrix(`
    @versioned(Versions) namespace Test {
      enum Versions { v1, v2 }
      model Foo {
        ref: Lib.LibModel;
      }
    }

    @versioned(Versions) namespace Lib {
      enum Versions { l1, l2 }
      model LibModel {
        prop: string;
      }
    }
  `);

  expect(resolutions).toEqual([
    { root: "v1", libs: { Lib: "l2" } },
    { root: "v2", libs: { Lib: "l2" } },
  ]);
});

it("referencing types from non versioned library is a noop", async () => {
  const resolutions = await resolveTimelineMatrix(`
    @versioned(Versions) namespace Test {
      enum Versions { v1, v2 }
      model Foo {
        ref: Lib.LibModel;
      }
    }

    namespace Lib {
      model LibModel {
        prop: string;
      }
    }
  `);

  expect(resolutions).toEqual([
    { root: "v1", libs: {} },
    { root: "v2", libs: {} },
  ]);
});
