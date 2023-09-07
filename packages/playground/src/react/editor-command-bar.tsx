import {
  Button,
  Dialog,
  DialogBody,
  DialogSurface,
  DialogTrigger,
  Link,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Bug16Regular, Save16Regular, Settings24Regular } from "@fluentui/react-icons";
import { CompilerOptions } from "@typespec/compiler";
import { FunctionComponent } from "react";
import { PlaygroundSample } from "../types.js";
import { EmitterDropdown } from "./emitter-dropdown.js";
import { SamplesDropdown } from "./samples-dropdown.js";
import { CompilerSettings } from "./settings/compiler-settings.js";
import { PlaygroundTspLibrary } from "./types.js";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  newIssue?: () => Promise<void> | void;
  libraries: PlaygroundTspLibrary[];
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
  newIssue,
  libraries,
  selectedEmitter,
  onSelectedEmitterChange,
  compilerOptions: emitterOptions,
  onCompilerOptionsChange,
  samples,
  selectedSampleName,
  onSelectedSampleNameChange,
}) => {
  const documentation = documentationUrl ? (
    <label>
      <Link href={documentationUrl} target="_blank">
        Docs
      </Link>
    </label>
  ) : undefined;

  const bugButton = newIssue ? <FileBugButton onClick={newIssue} /> : undefined;

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
        {samples && (
          <SamplesDropdown
            samples={samples}
            selectedSampleName={selectedSampleName}
            onSelectedSampleNameChange={onSelectedSampleNameChange}
          />
        )}
        <EmitterDropdown
          emitters={libraries.filter((x) => x.isEmitter).map((x) => x.name)}
          onSelectedEmitterChange={onSelectedEmitterChange}
          selectedEmitter={selectedEmitter}
        />
        <Dialog>
          <DialogTrigger>
            <Button icon={<Settings24Regular />} />
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <CompilerSettings
                libraries={libraries}
                selectedEmitter={selectedEmitter}
                options={emitterOptions}
                onOptionsChanged={onCompilerOptionsChange}
              />
            </DialogBody>
          </DialogSurface>
        </Dialog>
        {documentation}
        <div css={{ flex: "1" }}></div>
        {bugButton}
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
      >
        File bug
      </ToolbarButton>
    </Tooltip>
  );
};
