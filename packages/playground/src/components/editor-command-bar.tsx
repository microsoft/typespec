import { Link, Toolbar, ToolbarButton, Tooltip } from "@fluentui/react-components";
import { Bug16Regular, Save16Regular } from "@fluentui/react-icons";
import { FunctionComponent } from "react";
import { EmitterDropdown } from "./emitter-dropdown.js";
import { SamplesDropdown } from "./samples-dropdown.js";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  updateTypeSpec: (value: string) => Promise<void> | void;
  newIssue: () => Promise<void> | void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  documentationUrl,
  saveCode,
  updateTypeSpec,
  newIssue,
}) => {
  const documentation = documentationUrl ? (
    <label>
      <Link href={documentationUrl} target="_blank">
        Docs
      </Link>
    </label>
  ) : undefined;
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
        <SamplesDropdown onSelectSample={updateTypeSpec as any} />
        <EmitterDropdown />
        {documentation}
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
