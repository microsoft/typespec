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

/** Color palette for sample icons - using pleasant, distinct colors */
const iconColors = [
  { bg: "#e3f2fd", fg: "#1565c0" }, // Blue
  { bg: "#f3e5f5", fg: "#7b1fa2" }, // Purple
  { bg: "#e8f5e9", fg: "#2e7d32" }, // Green
  { bg: "#fff3e0", fg: "#e65100" }, // Orange
  { bg: "#fce4ec", fg: "#c2185b" }, // Pink
  { bg: "#e0f7fa", fg: "#00838f" }, // Cyan
  { bg: "#fff8e1", fg: "#f9a825" }, // Amber
  { bg: "#efebe9", fg: "#4e342e" }, // Brown
  { bg: "#e8eaf6", fg: "#3949ab" }, // Indigo
  { bg: "#e0f2f1", fg: "#00695c" }, // Teal
];

/** Simple geometric patterns for variety */
type PatternType = "circle" | "squares" | "triangle" | "hexagon" | "diamond";
const patterns: PatternType[] = ["circle", "squares", "triangle", "hexagon", "diamond"];

interface SampleIconProps {
  name: string;
}

const SampleIcon: FunctionComponent<SampleIconProps> = ({ name }) => {
  const { color, pattern, initials } = useMemo(() => {
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
      color: iconColors[colorIndex],
      pattern: patterns[patternIndex],
      initials: init,
    };
  }, [name]);

  const renderPattern = () => {
    const size = 48;
    const half = size / 2;

    switch (pattern) {
      case "circle":
        return <circle cx={half} cy={half} r={half - 4} fill={color.fg} opacity={0.15} />;
      case "squares":
        return (
          <>
            <rect x={4} y={4} width={16} height={16} fill={color.fg} opacity={0.1} />
            <rect x={28} y={28} width={16} height={16} fill={color.fg} opacity={0.15} />
          </>
        );
      case "triangle":
        return (
          <polygon points={`${half},8 ${size - 8},${size - 8} 8,${size - 8}`} fill={color.fg} opacity={0.12} />
        );
      case "hexagon":
        return (
          <polygon
            points={`${half},4 ${size - 6},${half / 2 + 4} ${size - 6},${size - half / 2 - 4} ${half},${size - 4} 6,${size - half / 2 - 4} 6,${half / 2 + 4}`}
            fill={color.fg}
            opacity={0.12}
          />
        );
      case "diamond":
        return (
          <polygon points={`${half},6 ${size - 6},${half} ${half},${size - 6} 6,${half}`} fill={color.fg} opacity={0.12} />
        );
    }
  };

  return (
    <div
      className={style["sample-icon"]}
      style={{ backgroundColor: color.bg }}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" className={style["sample-icon-pattern"]}>
        {renderPattern()}
      </svg>
      <span className={style["sample-icon-initials"]} style={{ color: color.fg }}>
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
