import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { useCallback, useState, type FunctionComponent } from "react";
import type { PlaygroundSample } from "../../types.js";
import { SampleCard } from "./sample-card.js";
import style from "./samples-drawer.module.css";

export interface SamplesDrawerProps {
  samples: Record<string, PlaygroundSample>;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export interface SamplesDrawerOverlayProps extends SamplesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The overlay drawer showing the sample gallery. Controlled via open/onOpenChange. */
export const SamplesDrawerOverlay: FunctionComponent<SamplesDrawerOverlayProps> = ({
  samples,
  onSelectedSampleNameChange,
  open,
  onOpenChange,
}) => {
  const handleSampleSelect = useCallback(
    (sampleName: string) => {
      onSelectedSampleNameChange(sampleName);
      onOpenChange(false);
    },
    [onSelectedSampleNameChange, onOpenChange],
  );

  return (
    <OverlayDrawer
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
      position="end"
      size="large"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          Sample Gallery
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div className={style["samples-grid"]}>
          {Object.entries(samples).map(([name, sample]) => (
            <SampleCard key={name} name={name} sample={sample} onSelect={handleSampleSelect} />
          ))}
        </div>
      </DrawerBody>
    </OverlayDrawer>
  );
};

/** Toolbar button trigger + overlay drawer for samples. */
export const SamplesDrawerTrigger: FunctionComponent<SamplesDrawerProps> = ({
  samples,
  onSelectedSampleNameChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip content="Browse samples" relationship="description" withArrow>
        <ToolbarButton
          aria-label="Browse samples"
          icon={<DocumentBulletList24Regular />}
          onClick={() => setIsOpen(true)}
        >
          Samples
        </ToolbarButton>
      </Tooltip>

      <SamplesDrawerOverlay
        samples={samples}
        onSelectedSampleNameChange={onSelectedSampleNameChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};
