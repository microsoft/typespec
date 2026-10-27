import { SSRProvider } from "@fluentui/react-components";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CoverageSummary, GeneratorCoverageSuiteReport } from "../apis.js";
import { CoverageOverview, type CoverageOverviewProps } from "./coverage-overview.js";
import { Dashboard } from "./dashboard.js";

const dataEmitter = "@azure-typespec/http-client-csharp";
const managementEmitter = "@azure-typespec/http-client-csharp-mgmt";
const groupEmitters = [{ name: "C#", emitters: [dataEmitter, managementEmitter] }];
const emitterDisplayNames = {
  [dataEmitter]: "Data plane",
  [managementEmitter]: "Management plane",
};

function createReport(
  results: GeneratorCoverageSuiteReport["results"],
  name = "Emitter",
): GeneratorCoverageSuiteReport {
  return {
    generatorMetadata: { name, version: "1.0.0", mode: "standard" },
    scenariosMetadata: { packageName: "test", version: "1.0.0", commit: "abc123" },
    createdAt: "2026-01-01T00:00:00Z",
    results,
  };
}

function createSummary(
  scenarioNames: string[],
  generatorReports: CoverageSummary["generatorReports"],
): CoverageSummary {
  return {
    tableName: "Test",
    manifest: {
      packageName: "test",
      commit: "abc123",
      version: "1.0.0",
      scenarios: scenarioNames.map((name) => ({
        name,
        scenarioDoc: `Doc for ${name}`,
        location: {
          path: "test.tsp",
          start: { line: 1, character: 1 },
          end: { line: 2, character: 1 },
        },
      })),
    },
    generatorReports,
  };
}

function renderCards(element: ReactNode): string[] {
  const html = renderToStaticMarkup(<SSRProvider>{element}</SSRProvider>);
  return Array.from(html.matchAll(/<article\b[^>]*>(.*?)<\/article>/gs), ([, content]) =>
    content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function renderOverview(props: CoverageOverviewProps): string[] {
  return renderCards(<CoverageOverview {...props} />);
}

const coverageSummaries = [
  createSummary(["data1", "data2", "data3", "data4"], {
    [dataEmitter]: createReport({
      data1: "pass",
      data2: "pass",
      data3: "not-applicable",
      data4: "fail",
    }),
  }),
  createSummary(["mgmt1", "mgmt2"], {
    [managementEmitter]: createReport({ mgmt1: "fail", mgmt2: "not-implemented" }),
  }),
];

describe("CoverageOverview", () => {
  it("combines disjoint scenario sets and preserves per-emitter rows", () => {
    expect(renderOverview({ coverageSummaries, groupEmitters, emitterDisplayNames })).toEqual([
      "C# 50% Data plane 75% Management plane 0%",
    ]);
  });

  it.each([
    ["fail", 0],
    ["pass", 100],
  ] as const)(
    "counts a covered scenario once when the other emitter reports %s",
    (status, percentage) => {
      expect(
        renderOverview({
          coverageSummaries: [
            createSummary(["shared"], {
              [dataEmitter]: createReport({ shared: "pass" }),
              [managementEmitter]: createReport({ shared: status }),
            }),
          ],
          groupEmitters,
          emitterDisplayNames,
        }),
      ).toEqual([`C# 100% Data plane 100% Management plane ${percentage}%`]);
    },
  );

  it("unions complementary coverage without double-counting shared successes", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["one", "two", "three", "four"], {
            [dataEmitter]: createReport({ one: "pass", two: "pass", three: "fail", four: "fail" }),
            [managementEmitter]: createReport({ one: "fail", two: "pass", three: "pass" }),
          }),
        ],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 75% Data plane 50% Management plane 50%"]);
  });

  it("aggregates each emitter across summaries before displaying its coverage", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["shared"], {
            [dataEmitter]: createReport({ shared: "pass" }),
          }),
          createSummary(["shared", "other1", "other2"], {
            [dataEmitter]: createReport({ shared: "fail", other1: "fail", other2: "fail" }),
          }),
        ],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 25% Data plane 25%"]);
  });

  it("does not group emitters just because they share a display name", () => {
    expect(
      renderOverview({
        coverageSummaries,
        emitterDisplayNames: { [dataEmitter]: "C#", [managementEmitter]: "C#" },
      }),
    ).toEqual(["C# 75%", "C# 0%"]);
  });

  it("keeps ungrouped emitters separate even when their name matches a group", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["shared"], {
            [dataEmitter]: createReport({ shared: "pass" }),
            "C#": createReport({ shared: "fail" }, "C#"),
          }),
        ],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 100% Data plane 100%", "C# 0%"]);
  });

  it("uses configured group and emitter order, followed by ungrouped emitters", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["shared"], {
            [managementEmitter]: createReport({ shared: "fail" }),
            [dataEmitter]: createReport({ shared: "pass" }),
            python: createReport({ shared: "pass" }, "Python"),
            js: createReport({ shared: "pass" }, "JavaScript"),
          }),
        ],
        groupEmitters: [{ name: "Python SDKs", emitters: ["python"] }, ...groupEmitters],
        emitterDisplayNames,
      }),
    ).toEqual([
      "Python SDKs 100% Python 100%",
      "C# 100% Data plane 100% Management plane 0%",
      "JavaScript 100%",
    ]);
  });

  it("counts completed statuses but not missing results or missing reports", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["pass", "na", "ns", "fail", "ni", "missing"], {
            [dataEmitter]: createReport({
              pass: "pass",
              na: "not-applicable",
              ns: "not-supported",
              fail: "fail",
              ni: "not-implemented",
              stale: "pass",
            }),
            [managementEmitter]: undefined,
          }),
        ],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 50% Data plane 50% Management plane 0%"]);
  });

  it("preserves display-name fallbacks in emitter rows", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["shared"], {
            [dataEmitter]: createReport({ shared: "pass" }, "SDK"),
            "@typespec/http-client-python": undefined,
            custom: undefined,
          }),
        ],
        groupEmitters: [
          {
            name: "Clients",
            emitters: [dataEmitter, "@typespec/http-client-python", "custom"],
          },
        ],
      }),
    ).toEqual(["Clients 100% SDK 100% Python 0% custom 0%"]);
  });

  it("handles groups with no scenarios without NaN", () => {
    expect(
      renderOverview({
        coverageSummaries: [createSummary([], { [dataEmitter]: createReport({}) })],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 0% Data plane 0%"]);
  });

  it("does not create cards for configured emitters absent from the summaries", () => {
    expect(
      renderToStaticMarkup(
        <CoverageOverview coverageSummaries={[]} groupEmitters={groupEmitters} />,
      ),
    ).toBe("");
  });

  it("ignores summaries that have no emitters in the group", () => {
    expect(
      renderOverview({
        coverageSummaries: [
          createSummary(["shared"], { [dataEmitter]: createReport({ shared: "pass" }) }),
          createSummary(["other"], { python: createReport({ other: "fail" }, "Python") }),
        ],
        groupEmitters,
        emitterDisplayNames,
      }),
    ).toEqual(["C# 100% Data plane 100%", "Python 0%"]);
  });

  it("ignores empty groups and does not repeat emitters listed twice in a group", () => {
    expect(
      renderOverview({
        coverageSummaries,
        groupEmitters: [
          { name: "Empty", emitters: [] },
          { name: "C#", emitters: [dataEmitter, managementEmitter, dataEmitter] },
        ],
        emitterDisplayNames,
      }),
    ).toEqual(["C# 50% Data plane 75% Management plane 0%"]);
  });
});

describe("Dashboard overview", () => {
  it("passes explicit groups through to the overview", () => {
    const props = { coverageSummaries, groupEmitters, emitterDisplayNames, showOverview: true };
    expect(renderCards(<Dashboard {...props} />)).toEqual([
      "C# 50% Data plane 75% Management plane 0%",
    ]);
  });

  it("does not show the overview unless enabled", () => {
    const props = { coverageSummaries, groupEmitters, emitterDisplayNames };
    expect(renderCards(<Dashboard {...props} />)).toEqual([]);
  });
});
