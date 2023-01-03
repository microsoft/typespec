import { Link, Tooltip } from "@fluentui/react-components";
import { Toolbar, ToolbarButton } from "@fluentui/react-components/unstable";
import { Bug16Regular, Save16Regular } from "@fluentui/react-icons";
import { FunctionComponent } from "react";
import { SamplesDropdown } from "./samples-dropdown.js";

export interface EditorCommandBarProps {
  saveCode: () => Promise<void> | void;
  updateCadl: (value: string) => Promise<void> | void;
  newIssue: () => Promise<void> | void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  saveCode,
  updateCadl,
  newIssue,
}) => {
  return (
    <div css={{ borderBottom: "1px solid #f5f5f5" }}>
      <Toolbar>
        <Tooltip content="Save" relationship="description" withArrow>
          <ToolbarButton
            appearance="primary"
            aria-label="Save"
            icon={<Save16Regular />}
            onClick={saveCode as any}
          />
        </Tooltip>
        <SamplesDropdown onSelectSample={updateCadl as any} />
        <Link href="https://microsoft.github.io/cadl" target="_blank">
          Docs
        </Link>
        <div css={{ flex: "1" }}></div>
        <Tooltip content="Save" relationship="description" withArrow>
          <ToolbarButton
            appearance="subtle"
            aria-label="File Bug Report"
            icon={<Bug16Regular />}
            onClick={newIssue as any}
          >
            File bug
          </ToolbarButton>
        </Tooltip>
      </Toolbar>
    </div>
  );
};
