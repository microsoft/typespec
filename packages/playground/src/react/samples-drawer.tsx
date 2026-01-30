import {
  Button,
  Card,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Text,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { useCallback, useState, type FunctionComponent } from "react";
import type { PlaygroundSample } from "../types.js";
import style from "./samples-drawer.module.css";

export interface SamplesDrawerProps {
  samples: Record<string, PlaygroundSample>;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export const SamplesDrawerTrigger: FunctionComponent<SamplesDrawerProps> = ({
  samples,
  onSelectedSampleNameChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSampleSelect = useCallback(
    (sampleName: string) => {
      onSelectedSampleNameChange(sampleName);
      setIsOpen(false);
    },
    [onSelectedSampleNameChange],
  );

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

      <OverlayDrawer
        open={isOpen}
        onOpenChange={(_, data) => setIsOpen(data.open)}
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
                onClick={() => setIsOpen(false)}
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
    </>
  );
};

interface SampleCardProps {
  name: string;
  sample: PlaygroundSample;
  onSelect: (name: string) => void;
}

const SampleCard: FunctionComponent<SampleCardProps> = ({ name, sample, onSelect }) => {
  return (
    <Card
      className={style["sample-card"]}
      onClick={() => onSelect(name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(name);
        }
      }}
    >
      <Text as="h3" weight="semibold" className={style["sample-title"]}>
        {name}
      </Text>
      {sample.description && (
        <Text as="p" className={style["sample-description"]}>
          {sample.description}
        </Text>
      )}
    </Card>
  );
};
