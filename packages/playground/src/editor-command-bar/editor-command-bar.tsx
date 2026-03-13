import {
  Link,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import {
  BookOpen16Regular,
  Broom16Filled,
  Bug16Regular,
  Checkmark16Regular,
  DocumentBulletList24Regular,
  MoreHorizontal24Filled,
  Save16Regular,
} from "@fluentui/react-icons";
import { useCallback, useMemo, useState, type FunctionComponent, type ReactNode } from "react";
import { EmitterDropdown } from "../react/emitter-dropdown.js";
import { SamplesDrawerOverlay, SamplesDrawerTrigger } from "../react/samples-drawer/index.js";
import { useIsMobile } from "../react/use-mobile.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";
import style from "./editor-command-bar.module.css";

export interface EditorCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  formatCode: () => Promise<void> | void;
  fileBug?: () => Promise<void> | void;
  commandBarButtons?: ReactNode;
  /** Menu items version of commandBarButtons for use in mobile overflow menu */
  commandBarMenuItems?: ReactNode;
  host: BrowserHost;
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;

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
  samples,
  selectedSampleName,
  onSelectedSampleNameChange,
  commandBarButtons,
  commandBarMenuItems,
}) => {
  const isMobile = useIsMobile();

  const emitters = useMemo(
    () =>
      Object.values(host.libraries)
        .filter((x) => x.isEmitter)
        .map((x) => x.name),
    [host.libraries],
  );

  if (isMobile) {
    return (
      <MobileCommandBar
        documentationUrl={documentationUrl}
        saveCode={saveCode}
        formatCode={formatCode}
        fileBug={fileBug}
        emitters={emitters}
        selectedEmitter={selectedEmitter}
        onSelectedEmitterChange={onSelectedEmitterChange}
        samples={samples}
        onSelectedSampleNameChange={onSelectedSampleNameChange}
        commandBarMenuItems={commandBarMenuItems}
      />
    );
  }

  const documentation = documentationUrl ? (
    <label>
      <Link href={documentationUrl} target="_blank">
        Docs
      </Link>
    </label>
  ) : undefined;

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
            <SamplesDrawerTrigger
              samples={samples}
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
        {fileBug && <FileBugButton onClick={fileBug} />}
      </Toolbar>
    </div>
  );
};

interface MobileCommandBarProps {
  documentationUrl?: string;
  saveCode: () => Promise<void> | void;
  formatCode: () => Promise<void> | void;
  fileBug?: () => Promise<void> | void;
  emitters: string[];
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;
  samples?: Record<string, PlaygroundSample>;
  onSelectedSampleNameChange: (sampleName: string) => void;
  commandBarMenuItems?: ReactNode;
}

const MobileCommandBar: FunctionComponent<MobileCommandBarProps> = ({
  documentationUrl,
  saveCode,
  formatCode,
  fileBug,
  emitters,
  selectedEmitter,
  onSelectedEmitterChange,
  samples,
  onSelectedSampleNameChange,
  commandBarMenuItems,
}) => {
  const [samplesOpen, setSamplesOpen] = useState(false);

  const handleFileBug = useCallback(() => {
    if (fileBug) void fileBug();
  }, [fileBug]);

  return (
    <div className={style["bar"]}>
      <Toolbar>
        <Tooltip content="Save" relationship="description" withArrow>
          <ToolbarButton aria-label="Save" icon={<Save16Regular />} onClick={saveCode as any} />
        </Tooltip>
        <Tooltip content="Format" relationship="description" withArrow>
          <ToolbarButton aria-label="Format" icon={<Broom16Filled />} onClick={formatCode as any} />
        </Tooltip>
        <div className={style["divider"]}></div>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="More actions" relationship="description" withArrow>
              <ToolbarButton
                aria-label="More actions"
                icon={<MoreHorizontal24Filled />}
                appearance="subtle"
              />
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {emitters.map((emitter) => (
                <MenuItem
                  key={emitter}
                  icon={emitter === selectedEmitter ? <Checkmark16Regular /> : undefined}
                  onClick={() => onSelectedEmitterChange(emitter)}
                >
                  {emitter}
                </MenuItem>
              ))}
              <MenuDivider />
              {samples && (
                <MenuItem
                  icon={<DocumentBulletList24Regular />}
                  onClick={() => setSamplesOpen(true)}
                >
                  Browse Samples
                </MenuItem>
              )}
              {commandBarMenuItems}
              {fileBug && (
                <MenuItem icon={<Bug16Regular />} onClick={handleFileBug}>
                  File Bug
                </MenuItem>
              )}
              {documentationUrl && (
                <MenuItem
                  icon={<BookOpen16Regular />}
                  onClick={() => window.open(documentationUrl, "_blank")}
                >
                  Documentation
                </MenuItem>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
      </Toolbar>

      {samples && (
        <SamplesDrawerOverlay
          samples={samples}
          onSelectedSampleNameChange={onSelectedSampleNameChange}
          open={samplesOpen}
          onOpenChange={setSamplesOpen}
        />
      )}
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
