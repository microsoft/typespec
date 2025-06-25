import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Title3,
  Tooltip,
} from "@fluentui/react-components";
import {
  BookInformation20Regular,
  Braces20Filled,
  ChevronDown20Filled,
  ChevronRight20Filled,
} from "@fluentui/react-icons";
import { ScenarioData } from "@typespec/spec-coverage-sdk";
import { FunctionComponent, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { ManifestTreeNode, TreeTableRow } from "./types.js";

export interface RowLabelCellProps {
  row: TreeTableRow;
}
const INDENT_SIZE = 14;
export const RowLabelCell: FunctionComponent<RowLabelCellProps> = ({ row }) => {
  const caret = row.hasChildren ? (
    row.expanded ? (
      <ChevronDown20Filled />
    ) : (
      <ChevronRight20Filled />
    )
  ) : null;
  const marginLeft = row.depth * INDENT_SIZE;
  const rowLabel = getLabelForRow(row);
  return (
    <td
      css={[
        {
          minWidth: 260,
          padding: "0 5px",
        },
        row.hasChildren ? { cursor: "pointer" } : undefined,
      ]}
      onClick={row.toggleExpand}
    >
      <div style={{ marginLeft, display: "flex", alignItems: "center" }}>
        <div
          css={{
            transition: "transform 0.2s linear",
          }}
        >
          {caret}
        </div>
        <div
          css={{
            marginLeft: "10px",
            flex: 1,
          }}
        >
          {rowLabel}
        </div>
        <div css={{}}>
          {row.item.scenario && <ScenarioInfoButton scenario={row.item.scenario} />}
          {row.item.scenario && <GotoSourceButton scenario={row.item.scenario} />}
        </div>
      </div>
    </td>
  );
};

type ScenarioInfoButtonProps = {
  scenario: ScenarioData;
};

const ScenarioInfoButton: FunctionComponent<ScenarioInfoButtonProps> = ({ scenario }) => {
  return (
    <Popover withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Tooltip content="Show scenario documentation" relationship="label">
          <Button
            icon={<BookInformation20Regular />}
            aria-label="Show information"
            appearance="transparent"
          />
        </Tooltip>
      </PopoverTrigger>
      <PopoverSurface>
        <Title3>Scenario documentation</Title3>
        <ReactMarkdown children={scenario.scenarioDoc} remarkPlugins={[]} />
      </PopoverSurface>
    </Popover>
  );
};

type ShowSourceButtonProps = {
  scenario: ScenarioData;
};
const GotoSourceButton: FunctionComponent<ShowSourceButtonProps> = ({ scenario }) => {
  const baseUrl = "https://github.com/Microsoft/typespec/tree/main/packages/http-specs/specs/";
  const start = getGithubLineNumber(scenario.location.start.line);
  const end = getGithubLineNumber(scenario.location.end.line);
  const url = `${baseUrl}/${scenario.location.path}#${start}-${end}`;
  return (
    <Tooltip content="Go to source" relationship="label">
      <Button
        icon={<Braces20Filled />}
        as="a"
        appearance="transparent"
        aria-label="Go to source"
        href={url}
        target="_blank"
      />
    </Tooltip>
  );
};

function getGithubLineNumber(value: number): `L${number}` {
  return `L${value + 1}`;
}

function getLabelForRow(row: TreeTableRow): string {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => {
    const countLeafChildren = (node: ManifestTreeNode): number => {
      if (Object.keys(node.children).length === 0) {
        return 1;
      }

      return Object.values(node.children).reduce((acc, child) => acc + countLeafChildren(child), 0);
    };

    const { name } = row.item;

    if (!row.hasChildren) {
      return name;
    }

    const totalLeafChildren = countLeafChildren(row.item);
    return `${name} (${totalLeafChildren} scenarios)`;
  }, [row.item, row.hasChildren]);
}
