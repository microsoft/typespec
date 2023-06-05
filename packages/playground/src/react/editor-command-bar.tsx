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
import { FunctionComponent } from "react";
import { EmitterOptions } from "../state.js";
import { EmitterDropdown } from "./emitter-dropdown.js";
import { OutputSettings } from "./output-settings.js";
import { SamplesDropdown } from "./samples-dropdown.js";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  newIssue: () => Promise<void> | void;
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;
  emitterOptions: EmitterOptions;
  onEmitterOptionsChange: (options: EmitterOptions) => void;
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}
export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = ({
  documentationUrl,
  saveCode,
  newIssue,
  selectedEmitter,
  onSelectedEmitterChange,
  emitterOptions,
  onEmitterOptionsChange,
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
        <SamplesDropdown selectedSampleName={selectedSampleName} onSelectedSampleNameChange={onSelectedSampleNameChange}/>
        <EmitterDropdown
          onSelectedEmitterChange={onSelectedEmitterChange}
          selectedEmitter={selectedEmitter}
        />
        <Dialog>
          <DialogTrigger>
            <Button icon={<Settings24Regular />} />
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <OutputSettings
                selectedEmitter={selectedEmitter}
                options={emitterOptions}
                optionsChanged={onEmitterOptionsChange}
              />
            </DialogBody>
          </DialogSurface>
        </Dialog>
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
