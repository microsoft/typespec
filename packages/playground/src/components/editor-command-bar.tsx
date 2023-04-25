import { Link, Toolbar, ToolbarButton, Tooltip } from "@fluentui/react-components";
import { Bug16Regular, Save16Regular } from "@fluentui/react-icons";
import { FunctionComponent, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { SampleConfig } from "../index.js";
import { PlaygroundManifest } from "../manifest.js";
import { selectedEmitterState } from "../state.js";
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

  const setEmitter = useSetRecoilState(selectedEmitterState);

  const onSelectSample = useCallback(
    (config: SampleConfig) => {
      if (!config.content) throw new Error("Unreachable: sample has no 'content' property");

      updateTypeSpec(config.content);

      setEmitter(config.preferredEmitter ?? PlaygroundManifest.defaultEmitter);
    },
    [setEmitter, updateTypeSpec]
  );

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
        <SamplesDropdown onSelectSample={onSelectSample} />
        <EmitterDropdown />
        {documentation}
        <div css={{ flex: "1" }}></div>
        <Tooltip content="File Bug Report" relationship="description" withArrow>
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
