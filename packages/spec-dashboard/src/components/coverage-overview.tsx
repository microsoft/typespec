import { Card, Text } from "@fluentui/react-components";
import { FunctionComponent, useMemo } from "react";
import { CoverageSummary } from "../apis.js";
import { GroupRatioColors, GroupRatios } from "../constants.js";
import style from "./coverage-overview.module.css";

interface EmitterOverview {
  name: string;
  displayName: string;
  coverageRatio: number;
}

export interface CoverageOverviewProps {
  coverageSummaries: CoverageSummary[];
  emitterDisplayNames?: Record<string, string>;
}

/**
 * Extracts a display-friendly name from a full emitter package name.
 * e.g. "@typespec/http-client-python" → "Python"
 */
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
  // Strip common prefix patterns
  const match = emitterName.match(/http-client-(\w+)$/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  return emitterName;
}

/**
 * Gets the accent color for a coverage ratio using the same thresholds as the coverage tables.
 */
function getOverviewColor(ratio: number): string {
  for (const [key, threshold] of Object.entries(GroupRatios)) {
    if (ratio >= threshold) {
      return GroupRatioColors[key as keyof typeof GroupRatios];
    }
  }
  return GroupRatioColors.zero;
}

/**
 * Displays a section with a grid of cards showing per-emitter coverage overview.
 */
export const CoverageOverview: FunctionComponent<CoverageOverviewProps> = ({
  coverageSummaries,
  emitterDisplayNames,
}) => {
  const emitterOverviews = useMemo(() => {
    // Aggregate scenarios per emitter across all summaries
    const emitterMap = new Map<
      string,
      {
        totalScenarios: number;
        coveredScenarios: number;
        report: CoverageSummary["generatorReports"][string];
      }
    >();

    for (const summary of coverageSummaries) {
      for (const [emitterName, report] of Object.entries(summary.generatorReports)) {
        if (!emitterMap.has(emitterName)) {
          emitterMap.set(emitterName, { totalScenarios: 0, coveredScenarios: 0, report });
        }
        const entry = emitterMap.get(emitterName)!;
        const scenarios = summary.manifest.scenarios;
        entry.totalScenarios += scenarios.length;
        if (report) {
          for (const scenario of scenarios) {
            const status = report.results[scenario.name];
            if (status === "pass" || status === "not-applicable" || status === "not-supported") {
              entry.coveredScenarios++;
            }
          }
        }
      }
    }

    const overviews: EmitterOverview[] = [];
    for (const [emitterName, data] of emitterMap) {
      overviews.push({
        name: emitterName,
        displayName: getEmitterDisplayName(emitterName, data.report, emitterDisplayNames),
        coverageRatio: data.totalScenarios > 0 ? data.coveredScenarios / data.totalScenarios : 0,
      });
    }

    return overviews;
  }, [coverageSummaries, emitterDisplayNames]);

  if (emitterOverviews.length === 0) {
    return null;
  }

  return (
    <section className={style["section"]}>
      <Text as="h2" weight="semibold" size={500} className={style["heading"]}>
        Coverage Overview
      </Text>
      <div className={style["grid"]}>
        {emitterOverviews.map((emitter) => (
          <EmitterOverviewCard key={emitter.name} emitter={emitter} />
        ))}
      </div>
    </section>
  );
};

interface EmitterOverviewCardProps {
  emitter: EmitterOverview;
}

const EmitterOverviewCard: FunctionComponent<EmitterOverviewCardProps> = ({ emitter }) => {
  const accentColor = getOverviewColor(emitter.coverageRatio);
  const percentage = Math.floor(emitter.coverageRatio * 100);

  return (
    <Card className={style["card"]} style={{ borderTop: `3px solid ${accentColor}` }}>
      <Text weight="semibold" size={300} className={style["card-name"]}>
        {emitter.displayName}
      </Text>
      <Text weight="bold" size={800} style={{ color: accentColor }}>
        {percentage}%
      </Text>
    </Card>
  );
};
