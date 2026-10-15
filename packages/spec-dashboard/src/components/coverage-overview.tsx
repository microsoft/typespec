import { Card, Text } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { useMemo } from "react";
import type { CoverageSummary, EmitterGroup } from "../apis.js";
import { GroupRatioColors, GroupRatios } from "../constants.js";
import { isScenarioCompleted } from "../utils/coverage-utils.js";
import style from "./coverage-overview.module.css";

interface EmitterOverview {
  name: string;
  displayName: string;
  totalScenarios: number;
  coveredScenarios: number;
}

interface OverviewGroup extends EmitterOverview {
  emitters: EmitterOverview[];
}

export interface CoverageOverviewProps {
  coverageSummaries: CoverageSummary[];
  emitterDisplayNames?: Record<string, string>;
  groupEmitters?: readonly EmitterGroup[];
}

function getEmitterDisplayName(
  emitterName: string,
  report: CoverageSummary["generatorReports"][string],
  emitterDisplayNames?: Record<string, string>,
): string {
  if (emitterDisplayNames?.[emitterName]) {
    return emitterDisplayNames[emitterName];
  }
  if (report?.generatorMetadata?.name) {
    return report.generatorMetadata.name;
  }
  const match = emitterName.match(/http-client-(\w+)$/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  return emitterName;
}

function getOverviewColor(ratio: number): string {
  for (const [key, threshold] of Object.entries(GroupRatios)) {
    if (ratio >= threshold) {
      return GroupRatioColors[key as keyof typeof GroupRatios];
    }
  }
  return GroupRatioColors.zero;
}

export const CoverageOverview: FunctionComponent<CoverageOverviewProps> = ({
  coverageSummaries,
  emitterDisplayNames,
  groupEmitters,
}) => {
  const overviews = useMemo(() => {
    const emitterOverviews = new Map<string, EmitterOverview>();

    for (const summary of coverageSummaries) {
      for (const [emitterName, report] of Object.entries(summary.generatorReports)) {
        let emitter = emitterOverviews.get(emitterName);
        if (!emitter) {
          emitter = {
            name: emitterName,
            displayName: getEmitterDisplayName(emitterName, report, emitterDisplayNames),
            totalScenarios: 0,
            coveredScenarios: 0,
          };
          emitterOverviews.set(emitterName, emitter);
        }
        emitter.totalScenarios += summary.manifest.scenarios.length;
        if (report) {
          for (const scenario of summary.manifest.scenarios) {
            if (isScenarioCompleted(report.results[scenario.name])) {
              emitter.coveredScenarios++;
            }
          }
        }
      }
    }

    const overviews: OverviewGroup[] = [];
    const groupedEmitters = new Set<string>();
    for (const [index, group] of (groupEmitters ?? []).entries()) {
      const emitters = Array.from(new Set(group.emitters))
        .map((name) => emitterOverviews.get(name))
        .filter((emitter) => emitter !== undefined);
      if (emitters.length === 0) {
        continue;
      }

      overviews.push({
        name: `group:${index}`,
        displayName: group.name,
        ...getCombinedCoverage(coverageSummaries, group.emitters),
        emitters,
      });
      for (const emitter of emitters) {
        groupedEmitters.add(emitter.name);
      }
    }

    for (const emitter of emitterOverviews.values()) {
      if (!groupedEmitters.has(emitter.name)) {
        overviews.push({ ...emitter, name: `emitter:${emitter.name}`, emitters: [] });
      }
    }

    return overviews;
  }, [coverageSummaries, emitterDisplayNames, groupEmitters]);

  if (overviews.length === 0) {
    return null;
  }

  return (
    <section className={style["section"]}>
      <Text as="h2" weight="semibold" size={500} className={style["heading"]}>
        Coverage Overview
      </Text>
      <div className={style["grid"]}>
        {overviews.map((overview) => (
          <OverviewCard key={overview.name} overview={overview} />
        ))}
      </div>
    </section>
  );
};

function getCombinedCoverage(
  coverageSummaries: CoverageSummary[],
  emitterNames: readonly string[],
): Pick<EmitterOverview, "totalScenarios" | "coveredScenarios"> {
  let totalScenarios = 0;
  let coveredScenarios = 0;
  for (const summary of coverageSummaries) {
    const reports = emitterNames
      .filter((name) => Object.hasOwn(summary.generatorReports, name))
      .map((name) => summary.generatorReports[name]);
    if (reports.length === 0) {
      continue;
    }

    // Scenario names are local to a summary, not global across spec sets.
    const scenarioNames = new Set(summary.manifest.scenarios.map((scenario) => scenario.name));
    totalScenarios += scenarioNames.size;
    for (const name of scenarioNames) {
      if (reports.some((report) => isScenarioCompleted(report?.results[name]))) {
        coveredScenarios++;
      }
    }
  }
  return { totalScenarios, coveredScenarios };
}

function getCoverageRatio(overview: EmitterOverview): number {
  return overview.totalScenarios > 0 ? overview.coveredScenarios / overview.totalScenarios : 0;
}

const OverviewCard: FunctionComponent<{ overview: OverviewGroup }> = ({ overview }) => {
  const coverageRatio = getCoverageRatio(overview);
  const accentColor = getOverviewColor(coverageRatio);
  const percentage = Math.floor(coverageRatio * 100);

  return (
    <article aria-label={overview.displayName} className={style["overview"]}>
      <Card className={style["card"]} style={{ borderTop: `3px solid ${accentColor}` }}>
        <Text weight="semibold" size={300} className={style["card-name"]}>
          {overview.displayName}
        </Text>
        <Text weight="bold" size={800} style={{ color: accentColor }}>
          {percentage}%
        </Text>
        {overview.emitters.length > 0 && (
          <dl className={style["emitters"]}>
            {overview.emitters.map((emitter) => {
              const ratio = getCoverageRatio(emitter);
              return (
                <div key={emitter.name} className={style["emitter-row"]}>
                  <dt className={style["emitter-name"]} title={emitter.name}>
                    <Text size={200}>{emitter.displayName}</Text>
                  </dt>
                  <dd className={style["emitter-percentage"]}>
                    <Text size={200} weight="semibold" style={{ color: getOverviewColor(ratio) }}>
                      {Math.floor(ratio * 100)}%
                    </Text>
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </Card>
    </article>
  );
};
