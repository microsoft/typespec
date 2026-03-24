import {
  Broom16Filled,
  Bug16Regular,
  Checkmark16Regular,
  DocumentBulletList24Regular,
  Save16Regular,
} from "@fluentui/react-icons";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import { EmitterDropdown } from "../react/emitter-dropdown.js";
import type { CommandBarItem } from "../react/responsive-command-bar/index.js";
import { ResponsiveCommandBar } from "../react/responsive-command-bar/index.js";
import { SamplesDrawerOverlay, SamplesDrawerTrigger } from "../react/samples-drawer/index.js";
import { useIsMobile } from "../react/use-mobile.js";
import type { BrowserHost, PlaygroundSample } from "../types.js";

export interface EditorCommandBarProps {
  saveCode: () => Promise<void> | void;
  formatCode: () => Promise<void> | void;
  fileBug?: () => Promise<void> | void;
  /** Additional items provided by the consumer. */
  commandBarItems?: readonly CommandBarItem[];
  host: BrowserHost;
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;

  samples?: Record<string, PlaygroundSample>;
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export const EditorCommandBar: FunctionComponent<EditorCommandBarProps> = (props) => {
  const {
    saveCode,
    formatCode,
    fileBug,
    host,
    selectedEmitter,
    onSelectedEmitterChange,
    samples,
    onSelectedSampleNameChange,
    commandBarItems: externalItems,
  } = props;

  const isMobile = useIsMobile();
  const [samplesDrawerOpen, setSamplesDrawerOpen] = useState(false);

  const emitters = useMemo(
    () =>
      Object.values(host.libraries)
        .filter((x) => x.isEmitter)
        .map((x) => x.name),
    [host.libraries],
  );

  const handleFileBug = useCallback(() => {
    if (fileBug) void fileBug();
  }, [fileBug]);

  const items = useMemo<CommandBarItem[]>(() => {
    const result: CommandBarItem[] = [
      {
        id: "save",
        label: "Save",
        icon: <Save16Regular />,
        onClick: saveCode as () => void,
        pinned: true,
      },
      {
        id: "format",
        label: "Format",
        icon: <Broom16Filled />,
        onClick: formatCode as () => void,
        pinned: true,
      },
    ];

    if (samples) {
      result.push({
        id: "samples",
        label: "Browse Samples",
        icon: <DocumentBulletList24Regular />,
        onClick: () => setSamplesDrawerOpen(true),
        toolbarItem: (
          <SamplesDrawerTrigger
            samples={samples}
            onSelectedSampleNameChange={onSelectedSampleNameChange}
          />
        ),
      });
    }

    result.push({
      id: "emitter",
      label: "Emitter",
      toolbarItem: (
        <EmitterDropdown
          emitters={emitters}
          selectedEmitter={selectedEmitter}
          onSelectedEmitterChange={onSelectedEmitterChange}
        />
      ),
      children: emitters.map((emitter) => ({
        id: `emitter-${emitter}`,
        label: emitter,
        icon: emitter === selectedEmitter ? <Checkmark16Regular /> : undefined,
        onClick: () => onSelectedEmitterChange(emitter),
      })),
    });

    if (externalItems) {
      result.push(...externalItems);
    }

    if (fileBug) {
      result.push({
        id: "file-bug",
        label: "File Bug",
        align: "right",
        icon: <Bug16Regular />,
        onClick: handleFileBug,
      });
    }

    return result;
  }, [
    saveCode,
    formatCode,
    samples,
    onSelectedSampleNameChange,
    emitters,
    selectedEmitter,
    onSelectedEmitterChange,
    externalItems,
    fileBug,
    handleFileBug,
  ]);

  return (
    <>
      <ResponsiveCommandBar items={items} isMobile={isMobile} />
      {isMobile && samples && (
        <SamplesDrawerOverlay
          samples={samples}
          onSelectedSampleNameChange={onSelectedSampleNameChange}
          open={samplesDrawerOpen}
          onOpenChange={setSamplesDrawerOpen}
        />
      )}
    </>
  );
};
