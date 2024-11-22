import { css } from "@emotion/react";
import { Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { CodeBlock16Filled, Print16Filled } from "@fluentui/react-icons";
import {
  ResolvedCoverageReport,
  ScenarioData,
  ScenarioManifest,
} from "@typespec/spec-coverage-sdk";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { CoverageSummary, GeneratorNames } from "../apis.js";
import { Colors } from "../constants.js";
import { GeneratorInformation } from "./generator-information.js";
import { ScenarioGroupRatioStatusBox } from "./scenario-group-status.js";
import { ScenarioStatusBox } from "./scenario-status.js";
import { RowLabelCell } from "./tree-table/row-label-cell.js";
import { ManifestTreeNode, TreeTableRow } from "./tree-table/types.js";

export interface DashboardTableProps {
  coverageSummary: CoverageSummary;
}

function buildTreeRows(
  node: ManifestTreeNode,
  expandedRows: Record<string, boolean>,
  toggleExpand: (key: string) => void,
  depth = 0,
): TreeTableRow[] {
  const rows: TreeTableRow[] = [];
  if (!node.children) {
    return [];
  }
  for (const child of Object.values(node.children)) {
    const hasChildren = Boolean(child.children && Object.keys(child.children).length > 0);
    const key = child.fullName;

    const expanded = expandedRows[key] ?? false;
    rows.push({
      key,
      item: child,
      expanded,
      depth,
      hasChildren,
      index: -1,
      toggleExpand: () => toggleExpand(key),
    });
    if (hasChildren && expanded) {
      for (const row of buildTreeRows(child, expandedRows, toggleExpand, depth + 1)) {
        rows.push(row);
      }
    }
  }
  for (const [index, row] of rows.entries()) {
    row.index = index;
    row.key = index.toString();
  }
  return rows;
}

export const DashboardTable: FunctionComponent<DashboardTableProps> = ({ coverageSummary }) => {
  const languages: GeneratorNames[] = Object.keys(coverageSummary.generatorReports) as any;
  const tree = useMemo(() => createTree(coverageSummary.manifest), [coverageSummary.manifest]);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleExpand = useCallback(
    (key: string) => {
      setExpandedRows((state) => {
        return { ...state, [key]: !state[key] };
      });
    },
    [setExpandedRows],
  );
  const treeRows = useMemo(() => {
    return buildTreeRows(tree, expandedRows, toggleExpand);
  }, [tree, expandedRows, toggleExpand]);

  const rows = treeRows.map((x) => {
    return (
      <DashboardRow key={x.key} coverageSummary={coverageSummary} languages={languages} row={x} />
    );
  });

  return (
    <table css={TableStyles}>
      <thead>
        <DashboardHeaderRow coverageSummary={coverageSummary} />
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};

export interface DashboardRowProps {
  row: TreeTableRow;
  languages: GeneratorNames[];
  coverageSummary: CoverageSummary;
}

const DashboardRow: FunctionComponent<DashboardRowProps> = ({
  row,
  languages,
  coverageSummary,
}) => {
  const scenarioData = row.item.scenario;
  return (
    <tr>
      <RowLabelCell row={row} />
      {languages.map((lang) => (
        <td key={lang} css={ScenarioStatusCellStyles}>
          {scenarioData ? (
            <ScenarioStatusBox
              status={coverageSummary.generatorReports[lang]?.results[scenarioData.name]}
            />
          ) : (
            <ScenarioGroupStatusBox
              coverageSummary={coverageSummary}
              group={row.item.fullName}
              lang={lang}
            />
          )}
        </td>
      ))}
    </tr>
  );
};

interface ScenarioGroupStatusBoxProps {
  coverageSummary: CoverageSummary;
  lang: GeneratorNames;
  group: string;
}
const ScenarioGroupStatusBox: FunctionComponent<ScenarioGroupStatusBoxProps> = ({
  lang,
  coverageSummary,
  group,
}) => {
  const report = coverageSummary.generatorReports[lang];
  const ratio = report ? getCompletedRatio(coverageSummary.manifest.scenarios, report, group) : 0;
  return <ScenarioGroupRatioStatusBox ratio={ratio} />;
};

function getCompletedRatio(
  scenarios: ScenarioData[],
  report: ResolvedCoverageReport,
  scope: string = "",
) {
  const filtered = scenarios.filter((x) => x.name.startsWith(scope));
  let coveredCount = 0;
  for (const scenario of filtered) {
    const status = report.results[scenario.name];
    if (status === "pass" || status === "not-applicable" || status === "not-supported") {
      coveredCount++;
    }
  }

  return coveredCount / filtered.length;
}

interface DashboardHeaderRowProps {
  coverageSummary: CoverageSummary;
}

const DashboardHeaderRow: FunctionComponent<DashboardHeaderRowProps> = ({ coverageSummary }) => {
  const data: [string, number, ResolvedCoverageReport | undefined][] = Object.entries(
    coverageSummary.generatorReports,
  ).map(([language, report]) => {
    if (report === undefined) {
      return [language, 0, undefined];
    }
    return [language, getCompletedRatio(coverageSummary.manifest.scenarios, report), report];
  });
  const tableHeaderName =
    coverageSummary.manifest.setName === "@azure-tools/azure-http-specs" ? "Azure" : "Standard";
  const tableHeader = <th>Scenario name ({tableHeaderName})</th>;
  return (
    <tr>
      {tableHeader}
      {data.map(([lang, status, report]) => (
        <GeneratorHeaderCell key={lang} status={status} report={report} language={lang} />
      ))}
    </tr>
  );
};
const TableStyles = css({
  borderCollapse: "collapse",
  "& tr:nth-of-type(2n)": {
    backgroundColor: Colors.bgSubtle,
  },
  "& td, & th": {
    border: `1px solid ${Colors.borderDefault}`,
    height: "32px",
  },
  "& th": {
    padding: "6px 13px",
    backgroundColor: Colors.bgSubtle,
  },
});

const ScenarioStatusCellStyles = css({
  padding: 0,
  width: 120,
});

export interface GeneratorHeaderCellProps {
  status: number;
  report: ResolvedCoverageReport | undefined;
  language: string;
}

export const GeneratorHeaderCell: FunctionComponent<GeneratorHeaderCellProps> = ({
  status,
  report,
  language,
}) => {
  return (
    <th css={{ padding: "0 !important" }}>
      <div
        css={{
          display: "grid",
          height: "100%",
          gridTemplateRows: "auto 26px 32px",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: `2px solid ${Colors.borderDefault}`,
          gridTemplateAreas: `
            "name name"
            "gen-version spec-version"
            "status status"
          `,
        }}
      >
        <div
          title="Generator name"
          css={{
            gridArea: "name",
            borderBottom: `1px solid ${Colors.borderDefault}`,
            padding: 5,
            textAlign: "center",
            cursor: "pointer",
            "&:hover": {
              background: Colors.borderDefault,
            },
          }}
        >
          <Popover withArrow>
            <PopoverTrigger>
              <div>{report?.generatorMetadata?.name ?? language}</div>
            </PopoverTrigger>
            <PopoverSurface>
              {report && <GeneratorInformation status={status} report={report} />}
            </PopoverSurface>
          </Popover>
        </div>
        <div
          title="Generator version used in this coverage."
          css={[
            versionStyles,
            {
              gridArea: "gen-version",
              borderRight: `1px solid ${Colors.borderDefault}`,
            },
          ]}
        >
          <Print16Filled css={{ marginRight: 5, flex: "0 0 auto" }} />

          {report?.generatorMetadata?.version ?? "?"}
        </div>
        <div
          title="Scenario version used in this coverage."
          css={[
            versionStyles,
            {
              gridArea: "spec-version",
            },
          ]}
        >
          <CodeBlock16Filled css={{ marginRight: 5, flex: "0 0 auto" }} />
          {report?.scenariosMetadata?.version ?? "?"}
        </div>
        <div
          title="Coverage stats"
          css={{ gridArea: "status", borderTop: `1px solid ${Colors.borderDefault}`, height: 32 }}
        >
          <ScenarioGroupRatioStatusBox ratio={status} />
        </div>
      </div>
    </th>
  );
};

const versionStyles = css({
  fontSize: "9pt",
  fontWeight: "normal",
  color: Colors.lightText,
  padding: 5,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "flex",
  width: 60,
  overflow: "hidden",
});

function createTree(manifest: ScenarioManifest): ManifestTreeNode {
  const root: ManifestTreeNode = { name: "", fullName: "", children: {} };

  const sortedScenarios = [...manifest.scenarios].sort((a, b) => a.name.localeCompare(b.name));
  for (const scenario of sortedScenarios) {
    const segments = scenario.name.split("_");
    let current: ManifestTreeNode = root;

    for (const [index, segment] of segments.entries()) {
      if (!(segment in current.children)) {
        current.children[segment] = {
          name: segment,
          fullName: segments.slice(0, index + 1).join("_"),
          children: {},
        };
      }
      current = current.children[segment];
    }

    current.scenario = scenario;
  }

  return cutTillMultipleChildren(root);
}

function cutTillMultipleChildren(node: ManifestTreeNode): ManifestTreeNode {
  let newRoot: ManifestTreeNode = node;
  while (newRoot.children) {
    if (Object.keys(newRoot.children).length === 1) {
      newRoot = Object.values(newRoot.children)[0];
    } else {
      break;
    }
  }

  return newRoot;
}
