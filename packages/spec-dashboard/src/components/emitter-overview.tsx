import { css } from "@emotion/react";
import { Card, CardHeader, Text, tokens } from "@fluentui/react-components";
import { FunctionComponent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CoverageSummary, GeneratorCoverageSuiteReport } from "../apis.js";
import { Colors } from "../constants.js";
import { useTierFiltering } from "../hooks/use-tier-filtering.js";
import { detectLanguage, LanguageIcon } from "../utils/language-utils.js";
import { TierConfig } from "../utils/tier-filtering-utils.js";
import { DashboardTable } from "./dashboard-table.js";
import { ScenarioGroupRatioStatusBox } from "./scenario-group-status.js";
import { TierFilterDropdown } from "./tier-filter.js";

export interface EmitterOverviewProps {
  coverageSummaries: CoverageSummary[];
  scenarioTierConfig?: TierConfig;
}

/**
 * High-level overview showing coverage percentages per emitter.
 * Clicking on an emitter navigates to the detailed scenario view.
 */
export const EmitterOverview: FunctionComponent<EmitterOverviewProps> = ({
  coverageSummaries,
  scenarioTierConfig,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tier from URL or default to "core"
  const tierFromUrl = searchParams.get("tier");
  const [selectedTier, setSelectedTier] = useState<string | undefined>(tierFromUrl || "core");

  // Sync URL when tier changes
  useEffect(() => {
    if (selectedTier) {
      setSearchParams({ tier: selectedTier });
    } else {
      setSearchParams({});
    }
  }, [selectedTier, setSearchParams]);

  const { filteredSummaries, allTiers } = useTierFiltering(
    coverageSummaries,
    scenarioTierConfig,
    selectedTier,
  );

  // Collect all unique emitters across all coverage summaries
  const emitterData = new Map<
    string,
    {
      name: string;
      totalScenarios: number;
      coveredScenarios: number;
      metadata?: GeneratorCoverageSuiteReport["generatorMetadata"];
    }
  >();

  // Use filtered summaries for emitter cards
  for (const summary of filteredSummaries) {
    for (const [emitterName, report] of Object.entries(summary.generatorReports)) {
      if (!report) continue;

      const existing = emitterData.get(emitterName);

      // Only count scenarios that exist in this emitter's results
      const emitterScenarios = summary.manifest.scenarios.filter((s) => s.name in report.results);
      const totalScenarios = emitterScenarios.length;

      let coveredCount = 0;
      for (const scenario of emitterScenarios) {
        const status = report.results[scenario.name];
        if (status === "pass" || status === "not-applicable" || status === "not-supported") {
          coveredCount++;
        }
      }

      if (existing) {
        existing.totalScenarios += totalScenarios;
        existing.coveredScenarios += coveredCount;
      } else {
        emitterData.set(emitterName, {
          name: emitterName,
          totalScenarios,
          coveredScenarios: coveredCount,
          metadata: report.generatorMetadata,
        });
      }
    }
  }

  const emitters = Array.from(emitterData.values()).sort((a, b) => {
    const nameA = a.metadata?.name ?? a.name;
    const nameB = b.metadata?.name ?? b.name;
    return nameA.localeCompare(nameB);
  });

  return (
    <div css={{ padding: "40px 20px", maxWidth: 1600, margin: "0 auto" }}>
      <div css={{ marginBottom: 32, textAlign: "center" }}>
        <Text as="h1" size={900} weight="bold" css={{ display: "block", marginBottom: 8 }}>
          Control Tower - Emitter Readiness
        </Text>
        <Text css={{ color: Colors.lightText, fontSize: 16 }}>
          Click on any emitter to view detailed scenario coverage
        </Text>
      </div>

      <TierFilterDropdown
        allTiers={allTiers}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
      />
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
          marginBottom: 64,
        }}
      >
        {emitters.map((emitter) => {
          const ratio = emitter.coveredScenarios / emitter.totalScenarios;
          const percentage = Math.floor(ratio * 100);
          const language = detectLanguage(emitter.name);

          return (
            <Card
              key={emitter.name}
              css={[
                EmitterCardStyles,
                {
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 24px rgba(0, 0, 0, 0.15)`,
                    borderColor: tokens.colorBrandStroke1,
                  },
                  "&:active": {
                    transform: "translateY(-2px)",
                  },
                },
              ]}
              onClick={async () => {
                const tierParam = selectedTier ? `?tier=${encodeURIComponent(selectedTier)}` : "";
                await navigate(`/emitter/${encodeURIComponent(emitter.name)}${tierParam}`);
              }}
            >
              <CardHeader
                header={
                  <div css={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LanguageIcon language={language} size={28} />
                    <Text weight="semibold" size={500} css={{ lineHeight: "1.4" }}>
                      {emitter.metadata?.name ?? emitter.name}
                    </Text>
                  </div>
                }
                css={{ paddingBottom: 8 }}
              />
              <div
                css={{
                  padding: "0 16px 16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  css={{
                    marginBottom: 16,
                    padding: "20px 0",
                    borderRadius: 8,
                  }}
                >
                  <div
                    css={{
                      fontSize: "64px",
                      fontWeight: "bold",
                      lineHeight: "1",
                      marginBottom: 8,
                    }}
                  >
                    <ScenarioGroupRatioStatusBox ratio={ratio} />
                  </div>
                </div>
                <div
                  css={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: tokens.colorNeutralForeground2,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {emitter.coveredScenarios} / {emitter.totalScenarios} scenarios
                </div>
                {emitter.metadata?.version && (
                  <div
                    css={{
                      fontSize: "13px",
                      color: Colors.lightText,
                      textAlign: "center",
                      fontFamily: "monospace",
                      backgroundColor: tokens.colorNeutralBackground3,
                      padding: "4px 8px",
                      borderRadius: 4,
                      display: "inline-block",
                      margin: "8px auto 0",
                    }}
                  >
                    v{emitter.metadata.version}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Full detailed tables section - show all scenarios without tier filtering */}
      <div css={{ borderTop: `2px solid ${tokens.colorNeutralStroke2}`, paddingTop: 40 }}>
        <Text
          as="h2"
          size={700}
          weight="bold"
          css={{ display: "block", marginBottom: 32, textAlign: "center" }}
        >
          Detailed Scenario Coverage
        </Text>
        {coverageSummaries.map((summary, i) => (
          <div key={i} css={{ marginBottom: 32 }}>
            <DashboardTable coverageSummary={summary} />
          </div>
        ))}
      </div>
    </div>
  );
};

const EmitterCardStyles = css({
  border: `1px solid ${tokens.colorNeutralStroke2}`,
  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)`,
  backgroundColor: tokens.colorNeutralBackground1,
  borderRadius: 8,
  overflow: "hidden",
});
