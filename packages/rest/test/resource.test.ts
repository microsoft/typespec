import { Model } from "@typespec/compiler";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getResourceTypeKey } from "../src/resource.js";
import { getSegment } from "../src/rest.js";
import { compileOperations, createRestTestRunner, getRoutesFor } from "./test-host.js";

describe("rest: resources", () => {
  it("@resource decorator emits a diagnostic when a @key property is not found", async () => {
    const [_, diagnostics] = await compileOperations(`
      @resource("thing")
      model Thing {
        id: string;
      }
      `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/rest/resource-missing-key",
      message:
        "Type 'Thing' is used as a resource and therefore must have a key. Use @key to designate a property as the key.",
    });
  });

  it("getResourceTypeKey works for base classes", async () => {
    const runner = await createRestTestRunner();
    const { Thing } = (await runner.compile(`

      model BaseThing {
        @key
        id: string;
      }

      @test
      @resource("things")
      model Thing extends BaseThing {
        extra: string;
      }
    `)) as { Thing: Model };

    // Check the key property to ensure the segment got added
    const key = getResourceTypeKey(runner.program, Thing);
    ok(key, "No key property found.");
    strictEqual(getSegment(runner.program, key.keyProperty), "things");
  });

  it("@resource decorator applies @segment decorator on the @key property", async () => {
    const runner = await createRestTestRunner();
    const { Thing } = (await runner.compile(`
      @test
      @resource("things")
      model Thing {
        @key
        id: string;
      }
    `)) as { Thing: Model };

    // Check the key property to ensure the segment got added
    const key = getResourceTypeKey(runner.program, Thing);
    ok(key, "No key property found.");
    strictEqual(getSegment(runner.program, key.keyProperty), "things");
  });

  it("@resource decorator applies @segment decorator that reaches route generation", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      @test
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
      }

      @error model Error {}

      interface Things extends ResourceRead<Thing, Error> {}
      `,
    );

    deepStrictEqual(routes, [
      {
        verb: "get",
        path: "/things/{thingId}",
        params: ["thingId"],
      },
    ]);
  });

  it("resources: generates standard operations for resource types and their children", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      namespace Things {
        model Thing {
          @key
          @segment("things")
          thingId: string;
        }

        @parentResource(Thing)
        model Subthing {
          @key
          @segment("subthings")
          subthingId: string;
        }

        @error model Error {}

        interface Things extends ResourceOperations<Thing, Error> {}
        interface Subthings extends ResourceOperations<Subthing, Error> {}
      }
      `,
    );

    deepStrictEqual(routes, [
      {
        verb: "get",
        path: "/things/{thingId}",
        params: ["thingId"],
      },
      {
        verb: "patch",
        path: "/things/{thingId}",
        params: ["thingId"],
      },
      {
        verb: "delete",
        path: "/things/{thingId}",
        params: ["thingId"],
      },
      {
        verb: "post",
        path: "/things",
        params: [],
      },
      {
        verb: "get",
        path: "/things",
        params: [],
      },
      {
        verb: "get",
        path: "/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
      {
        verb: "patch",
        path: "/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
      {
        verb: "delete",
        path: "/things/{thingId}/subthings/{subthingId}",
        params: ["thingId", "subthingId"],
      },
      {
        path: "/things/{thingId}/subthings",
        verb: "post",
        params: ["thingId"],
      },
      {
        verb: "get",
        path: "/things/{thingId}/subthings",
        params: ["thingId"],
      },
    ]);
  });

  it("resources: collection action paths are generated correctly", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      model Thing {
        @key
        @segment("things")
        thingId: string;
      }

      @autoRoute
      interface Things {
        @post
        @collectionAction(Thing, "export1")
        op exportThing(): {};

        @post
        @collectionAction(Thing, "export2")
        @actionSeparator(":")
        op exportThingWithColon2(): {};
      }
      `,
    );

    deepStrictEqual(routes, [
      {
        verb: "post",
        path: "/things/export1",
        params: [],
      },
      {
        verb: "post",
        path: "/things:export2",
        params: [],
      },
    ]);
  });

  it("resources: emit diagnostic if using 2 @key on the same model", async () => {
    const [_, diagnostics] = await compileOperations(`
      using TypeSpec.Rest.Resource;

      model Thing {
        @key("thingId")
        id: string;

        @key("anotherId")
        secondId: string;
      }
      `);

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/rest/duplicate-key",
        message: `More than one key found on model type Thing`,
      },
    ]);
  });

  it("resources: resources with parents must not have duplicate their parents' key names", async () => {
    const [_, diagnostics] = await compileOperations(`
      using TypeSpec.Rest.Resource;

      namespace Things {
        model Thing {
          @key("thingId")
          @segment("things")
          id: string;
        }

        @parentResource(Thing)
        model Subthing {
          @key
          @segment("subthings")
          thingId: string;
        }

        @parentResource(Subthing)
        model SubSubthing {
          @key
          @segment("subsubthings")
          subSubthingId: string;
        }

        @parentResource(SubSubthing)
        model SubSubSubthing {
          @key("thingId")
          @segment("subsubthings")
          subSubthingId: string;
        }
      }
      `);

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/rest/duplicate-parent-key",
        message: `Resource type 'Subthing' has a key property named 'thingId' which conflicts with the key name of a parent or child resource.`,
      },
      {
        code: "@typespec/rest/duplicate-parent-key",
        message: `Resource type 'Thing' has a key property named 'thingId' which conflicts with the key name of a parent or child resource.`,
      },
      {
        code: "@typespec/rest/duplicate-parent-key",
        message: `Resource type 'SubSubSubthing' has a key property named 'thingId' which conflicts with the key name of a parent or child resource.`,
      },
    ]);
  });

  it("resources: standard lifecycle operations have expected paths and verbs", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      model Thing {
        @key
        @segment("things")
        thingId: string;
      }

      @error model Error {}

      interface Things extends ResourceOperations<Thing, Error>, ResourceCreateOrReplace<Thing, Error> {
      }
      `,
    );

    deepStrictEqual(routes, [
      {
        params: ["thingId"],
        path: "/things/{thingId}",
        verb: "get",
      },
      {
        params: ["thingId"],
        path: "/things/{thingId}",
        verb: "patch",
      },
      {
        params: ["thingId"],
        path: "/things/{thingId}",
        verb: "delete",
      },
      {
        params: [],
        path: "/things",
        verb: "post",
      },
      {
        params: [],
        path: "/things",
        verb: "get",
      },
      {
        params: ["thingId"],
        path: "/things/{thingId}",
        verb: "put",
      },
    ]);
  });

  it("singleton resource: generates standard operations", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      namespace Things {
        model Thing {
          @key
          @segment("things")
          thingId: string;
        }

        @segment("singleton")
        model Singleton {
          data: string;
        }

        @error model Error {}

        interface Things extends ResourceRead<Thing, Error> {}
        interface ThingsSingleton extends SingletonResourceOperations<Singleton, Thing, Error> {}
      }
      `,
    );

    deepStrictEqual(routes, [
      {
        verb: "get",
        path: "/things/{thingId}",
        params: ["thingId"],
      },
      {
        verb: "get",
        path: "/things/{thingId}/singleton",
        params: ["thingId"],
      },
      {
        verb: "patch",
        path: "/things/{thingId}/singleton",
        params: ["thingId"],
      },
    ]);
  });

  it("extension resources: generates standard operations for extensions on parent and child resources", async () => {
    const routes = await getRoutesFor(
      `
      using TypeSpec.Rest.Resource;

      namespace Things {
        model Thing {
          @key
          @segment("things")
          thingId: string;
        }

        @parentResource(Thing)
        model Subthing {
          @key
          @segment("subthings")
          subthingId: string;
        }

        model Exthing {
          @key
          @segment("extension")
          exthingId: string;
        }

        @error model Error {}

        interface ThingsExtension extends ExtensionResourceOperations<Exthing, Thing, Error> {}
        interface SubthingsExtension extends ExtensionResourceOperations<Exthing, Subthing, Error> {}
      }
      `,
    );

    deepStrictEqual(routes, [
      {
        verb: "get",
        path: "/things/{thingId}/extension/{exthingId}",
        params: ["thingId", "exthingId"],
      },
      {
        verb: "patch",
        path: "/things/{thingId}/extension/{exthingId}",
        params: ["thingId", "exthingId"],
      },
      {
        verb: "delete",
        path: "/things/{thingId}/extension/{exthingId}",
        params: ["thingId", "exthingId"],
      },
      {
        verb: "post",
        path: "/things/{thingId}/extension",
        params: ["thingId"],
      },
      {
        verb: "get",
        path: "/things/{thingId}/extension",
        params: ["thingId"],
      },
      {
        verb: "get",
        path: "/things/{thingId}/subthings/{subthingId}/extension/{exthingId}",
        params: ["thingId", "subthingId", "exthingId"],
      },
      {
        verb: "patch",
        path: "/things/{thingId}/subthings/{subthingId}/extension/{exthingId}",
        params: ["thingId", "subthingId", "exthingId"],
      },
      {
        verb: "delete",
        path: "/things/{thingId}/subthings/{subthingId}/extension/{exthingId}",
        params: ["thingId", "subthingId", "exthingId"],
      },
      {
        verb: "post",
        path: "/things/{thingId}/subthings/{subthingId}/extension",
        params: ["thingId", "subthingId"],
      },
      {
        verb: "get",
        path: "/things/{thingId}/subthings/{subthingId}/extension",
        params: ["thingId", "subthingId"],
      },
    ]);
  });

  it("emit diagnostic if missing @key decorator on resource", async () => {
    const runner = await createRestTestRunner();
    const diagnostics = await runner.diagnose(
      `
      using TypeSpec.Rest.Resource;

      interface Dogs extends ResourceOperations<Dog, Error> {}

      model Dog {}
      @error model Error {code: string}
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/rest/resource-missing-key",
      message:
        "Type 'Dog' is used as a resource and therefore must have a key. Use @key to designate a property as the key.",
    });
  });

  it("emit diagnostic if missing @error decorator on error", async () => {
    const runner = await createRestTestRunner();
    const diagnostics = await runner.diagnose(
      `
      using TypeSpec.Rest.Resource;

      interface Dogs extends ResourceOperations<Dog, Error> {}
      
      model Dog {
        @key foo: string
      }
      model Error {code: string}
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/rest/resource-missing-error",
      message:
        "Type 'Error' is used as an error and therefore must have the @error decorator applied.",
    });
  });
});
