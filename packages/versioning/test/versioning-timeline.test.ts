import type { Namespace } from "@typespec/compiler";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { VersioningTimeline } from "../src/versioning-timeline.js";
import { resolveVersions } from "../src/versioning.js";
import { createVersioningTestRunner } from "./test-host.js";

describe("versioning: VersioningTimeline", () => {
  function generateLibraryNamespace(name: string, versions: string[]) {
    return `@versioned(Versions) namespace ${name} { enum Versions {${versions.join(",")}} } `;
  }

  async function resolveTimelineMatrix(
    serviceMapping: Record<string, string[]>,
    ...libraryVersions: string[][]
  ): Promise<string[][]> {
    function generateVersionMember(name: string, mapping: string[]) {
      return [
        ...mapping.map((x, i) => `@useDependency(${libNamespaceNames[i]}.Versions.${x})`),
        name,
      ].join("\n");
    }

    const libNamespaceNames = libraryVersions.map((_, i) => `TestLibNs_${i}`);
    const runner = await createVersioningTestRunner();
    const content = [
      `@versioned(Versions) namespace TestServiceNs {
          enum Versions {
            ${Object.entries(serviceMapping)
              .map(([k, v]) => generateVersionMember(k, v))
              .join(",\n")}
          }
      }`,
      ...libraryVersions.map((x, i) => generateLibraryNamespace(libNamespaceNames[i], x)),
    ].join("\n");
    await runner.compile(content);

    const serviceNamespace = runner.program
      .getGlobalNamespaceType()
      .namespaces.get("TestServiceNs")!;
    const libNamespaces: Namespace[] = libNamespaceNames.map(
      (x) => runner.program.getGlobalNamespaceType().namespaces.get(x)!,
    );
    const resolutions = resolveVersions(runner.program, serviceNamespace);
    const timeline = new VersioningTimeline(
      runner.program,
      resolutions.map((x) => x.versions),
    );
    const timelineMatrix: string[][] = [];

    for (const moment of timeline) {
      const cells: string[] = [moment.getVersion(serviceNamespace)?.name ?? ""];
      for (let i = 0; i < libraryVersions.length; i++) {
        cells.push(moment.getVersion(libNamespaces[i])?.name ?? "");
      }
      timelineMatrix.push(cells);
    }

    return timelineMatrix;
  }
  it("generate timeline where each service version map to a different library version", async () => {
    const timeline = await resolveTimelineMatrix({ v1: ["l1"], v2: ["l2"], v3: ["l3"] }, [
      "l1",
      "l2",
      "l3",
    ]);
    deepStrictEqual(timeline, [
      ["v1", "l1"],
      ["v2", "l2"],
      ["v3", "l3"],
    ]);
  });

  it("generate timeline where each service version map to a single library version", async () => {
    const timeline = await resolveTimelineMatrix({ v1: ["l1"], v2: ["l1"], v3: ["l1"] }, ["l1"]);
    deepStrictEqual(timeline, [
      ["v1", "l1"],
      ["v2", "l1"],
      ["v3", "l1"],
    ]);
  });

  it("generate timeline where each service version map to a one of the library versions", async () => {
    const timeline = await resolveTimelineMatrix({ v1: ["l2"], v2: ["l2"] }, [
      "l1",
      "l2",
      "l3",
      "l4",
    ]);
    deepStrictEqual(timeline, [
      ["", "l1"],
      ["v1", "l2"],
      ["v2", "l2"],
      ["", "l3"],
      ["", "l4"],
    ]);
  });

  it("generate timeline where service versions skip library versions", async () => {
    const timeline = await resolveTimelineMatrix({ v1: ["l2"], v2: ["l5"] }, [
      "l1",
      "l2",
      "l3",
      "l4",
      "l5",
      "l6",
    ]);
    deepStrictEqual(timeline, [
      ["", "l1"],
      ["v1", "l2"],
      ["", "l3"],
      ["", "l4"],
      ["v2", "l5"],
      ["", "l6"],
    ]);
  });

  it("generate timeline with multiple libraries", async () => {
    const timeline = await resolveTimelineMatrix(
      { v1: ["l2", "k1"], v2: ["l5", "k1"] },
      ["l1", "l2", "l3", "l4", "l5", "l6"],
      ["k1", "k2", "k3"],
    );
    deepStrictEqual(timeline, [
      ["", "l1", ""],
      ["v1", "l2", "k1"],
      ["", "l3", ""],
      ["", "l4", ""],
      ["v2", "l5", "k1"],
      ["", "", "k2"],
      ["", "", "k3"],
      ["", "l6", ""],
    ]);
  });
});
