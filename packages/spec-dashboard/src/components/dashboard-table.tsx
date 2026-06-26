import { mergeClasses, Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { CodeBlock16Filled, Print16Filled } from "@fluentui/react-icons";
import { ScenarioManifest } from "@typespec/spec-coverage-sdk";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { CoverageSummary, GeneratorCoverageSuiteReport } from "../apis.js";
import { getCompletedRatio } from "../utils/coverage-utils.js";
import style from "./dashboard-table.module.css";
import { GeneratorInformation } from "./generator-information.js";
import { ScenarioGroupRatioStatusBox } from "./scenario-group-status.js";
import { ScenarioStatusBox } from "./scenario-status.js";
import { RowLabelCell } from "./tree-table/row-label-cell.js";
import { ManifestTreeNode, TreeTableRow } from "./tree-table/types.js";

export interface DashboardTableProps {
  coverageSummary: CoverageSummary;
  emitterDisplayNames?: Record<string, string>;
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

export const DashboardTable: FunctionComponent<DashboardTableProps> = ({
  coverageSummary,
  emitterDisplayNames,
}) => {
  const languages: string[] = Object.keys(coverageSummary.generatorReports) as any;
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
    <table className={style["table"]}>
      <thead>
        <DashboardHeaderRow
          coverageSummary={coverageSummary}
          emitterDisplayNames={emitterDisplayNames}
        />
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};

export interface DashboardRowProps {
  row: TreeTableRow;
  languages: string[];
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
      <RowLabelCell manifest={coverageSummary.manifest} row={row} />
      {languages.map((lang) => (
        <td key={lang} className={style["scenario-status-cell"]}>
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
  lang: string;
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

interface DashboardHeaderRowProps {
  coverageSummary: CoverageSummary;
  emitterDisplayNames?: Record<string, string>;
}

const DashboardHeaderRow: FunctionComponent<DashboardHeaderRowProps> = ({
  coverageSummary,
  emitterDisplayNames,
}) => {
  const data: [string, number, GeneratorCoverageSuiteReport | undefined][] = Object.entries(
    coverageSummary.generatorReports,
  ).map(([language, report]) => {
    if (report === undefined) {
      return [language, 0, undefined];
    }
    return [language, getCompletedRatio(coverageSummary.manifest.scenarios, report), report];
  });
  const tableHeader = (
    <th>{coverageSummary.tableName || coverageSummary.manifest.displayName || "Specs"} </th>
  );
  return (
    <tr>
      {tableHeader}
      {data.map(([lang, status, report]) => (
        <GeneratorHeaderCell
          key={lang}
          status={status}
          report={report}
          language={lang}
          displayName={emitterDisplayNames?.[lang as string]}
        />
      ))}
    </tr>
  );
};

export interface GeneratorHeaderCellProps {
  status: number;
  report: GeneratorCoverageSuiteReport | undefined;
  language: string;
  displayName?: string;
}

export const GeneratorHeaderCell: FunctionComponent<GeneratorHeaderCellProps> = ({
  status,
  report,
  language,
  displayName,
}) => {
  return (
    <th className={style["header-cell"]}>
      <div className={style["header-grid"]}>
        <div title="Generator name" className={style["header-name"]}>
          <Popover withArrow>
            <PopoverTrigger>
              <div>{displayName ?? report?.generatorMetadata?.name ?? language}</div>
            </PopoverTrigger>
            <PopoverSurface>
              {report && <GeneratorInformation status={status} report={report} />}
            </PopoverSurface>
          </Popover>
        </div>
        <div
          title="Generator version used in this coverage."
          className={mergeClasses(style["version"], style["gen-version"])}
        >
          <Print16Filled className={style["version-icon"]} />

          {report?.generatorMetadata?.version ?? "?"}
        </div>
        <div
          title="Scenario version used in this coverage."
          className={mergeClasses(style["version"], style["spec-version"])}
        >
          <CodeBlock16Filled className={style["version-icon"]} />
          {report?.scenariosMetadata?.version ?? "?"}
        </div>
        <div title="Coverage stats" className={style["header-status"]}>
          <ScenarioGroupRatioStatusBox ratio={status} />
        </div>
      </div>
    </th>
  );
};

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

  return root;
}
