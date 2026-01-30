import {
  Button,
  Card,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Text,
  tokens,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import type { PlaygroundSample } from "../types.js";
import style from "./samples-drawer.module.css";

/** Generate a deterministic hash from a string */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/** Color palette using FluentUI tokens - using Background2 for light bg */
const iconColors = [
  { bg: tokens.colorPaletteBlueBackground2, fg: tokens.colorPaletteBlueForeground2 },
  { bg: tokens.colorPaletteGrapeBackground2, fg: tokens.colorPaletteGrapeForeground2 },
  { bg: tokens.colorPaletteForestBackground2, fg: tokens.colorPaletteForestForeground2 },
  { bg: tokens.colorPalettePumpkinBackground2, fg: tokens.colorPalettePumpkinForeground2 },
  { bg: tokens.colorPaletteMagentaBackground2, fg: tokens.colorPaletteMagentaForeground2 },
  { bg: tokens.colorPaletteTealBackground2, fg: tokens.colorPaletteTealForeground2 },
  { bg: tokens.colorPaletteGoldBackground2, fg: tokens.colorPaletteGoldForeground2 },
  { bg: tokens.colorPalettePlumBackground2, fg: tokens.colorPalettePlumForeground2 },
  { bg: tokens.colorPaletteLavenderBackground2, fg: tokens.colorPaletteLavenderForeground2 },
  { bg: tokens.colorPaletteSteelBackground2, fg: tokens.colorPaletteSteelForeground2 },
];

/** Simple geometric patterns for variety */
type PatternType = "circle" | "squares" | "triangle" | "hexagon" | "diamond";
const patterns: PatternType[] = ["circle", "squares", "triangle", "hexagon", "diamond"];

interface SampleIconProps {
  name: string;
}

const SampleIcon: FunctionComponent<SampleIconProps> = ({ name }) => {
  const { colors, pattern, initials } = useMemo(() => {
    const hash = hashString(name);
    const colorIndex = hash % iconColors.length;
    const patternIndex = (hash >> 4) % patterns.length;
    // Get first letter of first two words, or first two letters
    const words = name.split(/\s+/);
    const init =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      colors: iconColors[colorIndex],
      pattern: patterns[patternIndex],
      initials: init,
    };
  }, [name]);

  const renderPattern = () => {
    const size = 48;
    const half = size / 2;

    switch (pattern) {
      case "circle":
        return <circle cx={half} cy={half} r={half - 4} fill={colors.fg} opacity={0.15} />;
      case "squares":
        return (
          <>
            <rect x={4} y={4} width={16} height={16} fill={colors.fg} opacity={0.1} />
            <rect x={28} y={28} width={16} height={16} fill={colors.fg} opacity={0.15} />
          </>
        );
      case "triangle":
        return (
          <polygon
            points={`${half},8 ${size - 8},${size - 8} 8,${size - 8}`}
            fill={colors.fg}
            opacity={0.12}
          />
        );
      case "hexagon":
        return (
          <polygon
            points={`${half},4 ${size - 6},${half / 2 + 4} ${size - 6},${size - half / 2 - 4} ${half},${size - 4} 6,${size - half / 2 - 4} 6,${half / 2 + 4}`}
            fill={colors.fg}
            opacity={0.12}
          />
        );
      case "diamond":
        return (
          <polygon
            points={`${half},6 ${size - 6},${half} ${half},${size - 6} 6,${half}`}
            fill={colors.fg}
            opacity={0.12}
          />
        );
    }
  };

  return (
    <div className={style["sample-icon"]} style={{ backgroundColor: colors.bg }} aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 48 48" className={style["sample-icon-pattern"]}>
        {renderPattern()}
      </svg>
      <span className={style["sample-icon-initials"]} style={{ color: colors.fg }}>
        {initials}
      </span>
    </div>
  );
};

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
      <div className={style["sample-card-content"]}>
        <SampleIcon name={name} />
        <div className={style["sample-card-text"]}>
          <Text as="h3" weight="semibold" className={style["sample-title"]}>
            {name}
          </Text>
          {sample.description && (
            <Text as="p" className={style["sample-description"]}>
              {sample.description}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};
