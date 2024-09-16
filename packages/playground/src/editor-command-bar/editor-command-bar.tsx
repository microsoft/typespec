import { Link, Toolbar, ToolbarButton, Tooltip } from "@fluentui/react-components";
import { Broom16Filled, Bug16Regular, Save16Regular } from "@fluentui/react-icons";
import type { CompilerOptions } from "@typespec/compiler";
import { useMemo, type FunctionComponent, type ReactNode } from "react";
import { EmitterDropdown } from "../react/emitter-dropdown.js";
import { SamplesDropdown } from "../react/samples-dropdown.js";
import { CompilerSettingsDialogButton } from "../react/settings/compiler-settings-dialog-button.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";
import style from "./editor-command-bar.module.css";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  formatCode: () => Promise<void> | void;
  fileBug?: () => Promise<void> | void;
  commandBarButtons?: ReactNode;
  host: BrowserHost;
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;
  compilerOptions: CompilerOptions;
  onCompilerOptionsChange: (options: CompilerOptions) => void;

  samples?: Record<string, PlaygroundSample>;
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  documentationUrl,
  saveCode,
  formatCode,
  fileBug,
  host,
  selectedEmitter,
  onSelectedEmitterChange,
  compilerOptions,
  onCompilerOptionsChange,
  samples,
  selectedSampleName,
  onSelectedSampleNameChange,
  commandBarButtons,
}) => {
  const documentation = documentationUrl ? (
    <label>
      <Link href={documentationUrl} target="_blank">
        Docs
      </Link>
    </label>
  ) : undefined;

  const bugButton = fileBug ? <FileBugButton onClick={fileBug} /> : undefined;

  const emitters = useMemo(
    () =>
      Object.values(host.libraries)
        .filter((x) => x.isEmitter)
        .map((x) => x.name),
    [host.libraries],
  );

  return (
    <div className={style["bar"]}>
      <Toolbar>
        <Tooltip content="Save" relationship="description" withArrow>
          <ToolbarButton aria-label="Save" icon={<Save16Regular />} onClick={saveCode as any} />
        </Tooltip>
        <Tooltip content="Format" relationship="description" withArrow>
          <ToolbarButton aria-label="Format" icon={<Broom16Filled />} onClick={formatCode as any} />
        </Tooltip>
        {samples && (
          <>
            <SamplesDropdown
              samples={samples}
              selectedSampleName={selectedSampleName}
              onSelectedSampleNameChange={onSelectedSampleNameChange}
            />
            <div className={style["spacer"]}></div>
          </>
        )}
        <EmitterDropdown
          emitters={emitters}
          onSelectedEmitterChange={onSelectedEmitterChange}
          selectedEmitter={selectedEmitter}
        />

        {documentation && (
          <>
            <div className={style["spacer"]}></div>
            {documentation}
          </>
        )}
        <div className={style["divider"]}></div>
        {commandBarButtons}
        {bugButton}
        <CompilerSettingsDialogButton
          compilerOptions={compilerOptions}
          onCompilerOptionsChange={onCompilerOptionsChange}
          selectedEmitter={selectedEmitter}
        />
      </Toolbar>
    </div>
  );
};

interface FileBugButtonProps {
  onClick: () => Promise<void> | void;
}
const FileBugButton: FunctionComponent<FileBugButtonProps> = ({ onClick }) => {
  return (
    <Tooltip content="File Bug Report" relationship="description" withArrow>
      <ToolbarButton
        appearance="subtle"
        aria-label="File Bug Report"
        icon={<Bug16Regular />}
        onClick={onClick as any}
      ></ToolbarButton>
    </Tooltip>
  );
};
