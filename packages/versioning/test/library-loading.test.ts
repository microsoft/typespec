import { projectProgram, type Namespace } from "@typespec/compiler";
import { createTestWrapper, type BasicTestRunner } from "@typespec/compiler/testing";
import { notStrictEqual, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { buildVersionProjections } from "../src/projection.js";
import { createVersioningTestHost } from "./test-host.js";

describe("versioning: library loading", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(host, {
      wrapper: (code) => `
      import "@typespec/versioning";

      using TypeSpec.Versioning;
      
      @versioned(Versions)
      @test namespace TestService {
        enum Versions {v1, v2, v3, v4}
        ${code}
      }`,
    });
  });

  it("is not affected when multiple instance of library are loaded", async () => {
    const { TestService } = (await runner.compile(`@added(Versions.v2) model Foo {}`)) as {
      TestService: Namespace;
    };
    // Force loading a different version
    const { buildVersionProjections: buildVersionProjectionsDifferent } = await import(
      "../src/projection.js?different=1" as any
    );
    notStrictEqual(
      buildVersionProjections,
      buildVersionProjectionsDifferent,
      "The instance of the function loaded should have been different",
    );
    const versions = buildVersionProjectionsDifferent(runner.program, TestService);

    const v1Program = projectProgram(runner.program, versions[0].projections);
    strictEqual(
      v1Program.getGlobalNamespaceType().namespaces.get("TestService")!.models.has("Foo"),
      false,
    );

    const v2Program = projectProgram(runner.program, versions[1].projections);
    strictEqual(
      v2Program.getGlobalNamespaceType().namespaces.get("TestService")!.models.has("Foo"),
      true,
    );
  });
});
