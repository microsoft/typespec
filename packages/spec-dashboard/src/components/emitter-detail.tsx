import { Button } from "@fluentui/react-components";
import { ArrowLeft24Regular } from "@fluentui/react-icons";
import { FunctionComponent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CoverageSummary } from "../apis.js";
import { useTierFiltering } from "../hooks/use-tier-filtering.js";
import { detectLanguage, LanguageIcon } from "../utils/language-utils.js";
import { TierConfig } from "../utils/tier-filtering-utils.js";
import { DashboardTable } from "./dashboard-table.js";
import { TierFilterDropdown } from "./tier-filter.js";

export interface EmitterDetailProps {
  coverageSummaries: CoverageSummary[];
  scenarioTierConfig?: TierConfig;
}

/**
 * Detailed view showing all scenarios for a specific emitter.
 */
export const EmitterDetail: FunctionComponent<EmitterDetailProps> = ({
  coverageSummaries,
  scenarioTierConfig,
}) => {
  const { emitterName } = useParams<{ emitterName: string }>();
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

  const { filteredSummaries: tierFilteredSummaries, allTiers } = useTierFiltering(
    coverageSummaries,
    scenarioTierConfig,
    selectedTier,
  );

  if (!emitterName) {
    return <div>Error: No emitter specified</div>;
  }

  const decodedEmitterName = decodeURIComponent(emitterName);

  // Filter coverage summaries to only include the selected emitter
  const filteredSummaries: CoverageSummary[] = tierFilteredSummaries
    .map((summary) => {
      const report = summary.generatorReports[decodedEmitterName];
      if (!report) return null;

      // Filter the manifest to only include scenarios that exist in this emitter's results
      const filteredScenarios = summary.manifest.scenarios.filter(
        (scenario) => scenario.name in report.results,
      );

      return {
        ...summary,
        manifest: {
          ...summary.manifest,
          scenarios: filteredScenarios,
        },
        generatorReports: {
          [decodedEmitterName]: report,
        },
      };
    })
    .filter((summary): summary is NonNullable<typeof summary> => summary !== null);

  if (filteredSummaries.length === 0) {
    return (
      <div css={{ padding: "40px 20px", maxWidth: 1600, margin: "0 auto" }}>
        <Button
          icon={<ArrowLeft24Regular />}
          onClick={() => {
            const tierParam = selectedTier ? `?tier=${encodeURIComponent(selectedTier)}` : "";
            void navigate(`/${tierParam}`);
          }}
          css={{ marginBottom: 32 }}
          appearance="subtle"
          size="large"
        >
          Back to Overview
        </Button>
        <div
          css={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#fef6f6",
            borderRadius: 8,
            border: "1px solid #f4d5d5",
            color: "#8b4040",
          }}
        >
          No data found for emitter: {decodedEmitterName}
        </div>
      </div>
    );
  }

  // Get metadata from the first report (all should have the same metadata)
  const firstReport =
    filteredSummaries.length > 0
      ? Object.values(filteredSummaries[0].generatorReports)[0]
      : undefined;
  const metadata = firstReport?.generatorMetadata;
  const language = detectLanguage(decodedEmitterName);

  return (
    <div css={{ padding: "40px 20px", maxWidth: 1600, margin: "0 auto" }}>
      <Button
        icon={<ArrowLeft24Regular />}
        onClick={() => {
          const tierParam = selectedTier ? `?tier=${encodeURIComponent(selectedTier)}` : "";
          void navigate(`/${tierParam}`);
        }}
        css={{ marginBottom: 32 }}
        appearance="subtle"
        size="large"
      >
        Back to Overview
      </Button>

      <TierFilterDropdown
        allTiers={allTiers}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
      />

      <div css={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #e0e0e0" }}>
        <div css={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <LanguageIcon language={language} size={40} />
          <h1
            css={{
              margin: 0,
              fontSize: 32,
              fontWeight: 600,
              color: "#323130",
            }}
          >
            {metadata?.name ?? decodedEmitterName}
          </h1>
        </div>
        {metadata && (
          <div
            css={{
              marginTop: 8,
              fontSize: 14,
              color: "#605e5c",
              display: "inline-block",
              backgroundColor: "#f3f2f1",
              padding: "6px 12px",
              borderRadius: 4,
              fontFamily: "monospace",
            }}
          >
            Version: {metadata.version}
          </div>
        )}
      </div>

      <div>
        {filteredSummaries.map((summary, i) => (
          <div key={i} css={{ marginBottom: 32 }}>
            <DashboardTable coverageSummary={summary} />
          </div>
        ))}
      </div>
    </div>
  );
};
