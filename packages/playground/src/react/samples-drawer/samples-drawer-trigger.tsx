import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  SearchBox,
  Text,
  ToggleButton,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import type { PlaygroundSample, PlaygroundTspLibrary } from "../../types.js";
import { getEmitterDisplayName, isSampleCompatibleWithEmitter } from "../emitter-utils.js";
import { SampleCard } from "./sample-card.js";
import style from "./samples-drawer.module.css";

export interface SamplesDrawerProps {
  samples: Record<string, PlaygroundSample>;
  emitters: Record<string, PlaygroundTspLibrary>;
  onSelectedSampleNameChange: (sampleName: string, emitter?: string) => void;
}

export interface SamplesDrawerOverlayProps extends SamplesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SampleCategory {
  name: string;
  entries: [string, PlaygroundSample][];
}

function groupAndFilterSamples(
  samples: Record<string, PlaygroundSample>,
  searchQuery: string,
  emitterFilter: string | null,
  emitters: Record<string, PlaygroundTspLibrary>,
): SampleCategory[] {
  const query = searchQuery.toLowerCase().trim();
  const categoryMap = new Map<string, [string, PlaygroundSample][]>();

  for (const [name, sample] of Object.entries(samples)) {
    if (emitterFilter) {
      const emitterLib = emitters[emitterFilter];
      const tags = emitterLib?.emitterTags ?? [];
      if (!isSampleCompatibleWithEmitter(sample, emitterFilter, tags)) continue;
    }

    if (query) {
      const matchesName = name.toLowerCase().includes(query);
      const matchesDescription = sample.description?.toLowerCase().includes(query);
      const matchesCategory = sample.category?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription && !matchesCategory) continue;
    }

    const category = sample.category ?? "Other";
    let entries = categoryMap.get(category);
    if (!entries) {
      entries = [];
      categoryMap.set(category, entries);
    }
    entries.push([name, sample]);
  }

  return Array.from(categoryMap.entries())
    .map(([name, entries]) => ({ name, entries }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The overlay drawer showing the sample gallery. Controlled via open/onOpenChange. */
export const SamplesDrawerOverlay: FunctionComponent<SamplesDrawerOverlayProps> = ({
  samples,
  emitters,
  onSelectedSampleNameChange,
  open,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [emitterFilter, setEmitterFilter] = useState<string | null>(null);

  const handleSampleSelect = useCallback(
    (sampleName: string, emitter?: string) => {
      onSelectedSampleNameChange(sampleName, emitter);
      onOpenChange(false);
    },
    [onSelectedSampleNameChange, onOpenChange],
  );

  const emitterList = useMemo(
    () =>
      Object.values(emitters)
        .filter((e) => e.isEmitter)
        .map((e) => e.name)
        .sort(),
    [emitters],
  );

  const categories = useMemo(
    () => groupAndFilterSamples(samples, searchQuery, emitterFilter, emitters),
    [samples, searchQuery, emitterFilter, emitters],
  );
  const hasCategories = useMemo(() => Object.values(samples).some((s) => s.category), [samples]);
  const totalFiltered = useMemo(
    () => categories.reduce((sum, c) => sum + c.entries.length, 0),
    [categories],
  );

  return (
    <OverlayDrawer
      open={open}
      onOpenChange={(_, data) => {
        onOpenChange(data.open);
        if (!data.open) {
          setSearchQuery("");
          setEmitterFilter(null);
        }
      }}
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
        <div className={style["samples-search"]}>
          <SearchBox
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            className={style["search-input"]}
          />
        </div>

        {emitterList.length > 1 && (
          <div className={style["emitter-filter"]}>
            <ToggleButton
              size="small"
              appearance={emitterFilter === null ? "primary" : "subtle"}
              checked={emitterFilter === null}
              onClick={() => setEmitterFilter(null)}
              className={style["emitter-filter-chip"]}
            >
              All
            </ToggleButton>
            {emitterList.map((emitter) => (
              <ToggleButton
                key={emitter}
                size="small"
                appearance={emitterFilter === emitter ? "primary" : "subtle"}
                checked={emitterFilter === emitter}
                onClick={() => setEmitterFilter(emitterFilter === emitter ? null : emitter)}
                className={style["emitter-filter-chip"]}
              >
                {getEmitterDisplayName(emitter)}
              </ToggleButton>
            ))}
          </div>
        )}

        {totalFiltered === 0 ? (
          <div className={style["samples-empty"]}>
            <Text>No samples match your search.</Text>
          </div>
        ) : hasCategories ? (
          categories.map((category) => (
            <div key={category.name} className={style["samples-category"]}>
              <Text as="h3" weight="semibold" className={style["category-title"]}>
                {category.name}
              </Text>
              <div className={style["samples-grid"]}>
                {category.entries.map(([name, sample]) => (
                  <SampleCard
                    key={name}
                    name={name}
                    sample={sample}
                    emitters={emitters}
                    onSelect={handleSampleSelect}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={style["samples-grid"]}>
            {categories.flatMap((c) =>
              c.entries.map(([name, sample]) => (
                <SampleCard key={name} name={name} sample={sample} emitters={emitters} onSelect={handleSampleSelect} />
              )),
            )}
          </div>
        )}
      </DrawerBody>
    </OverlayDrawer>
  );
};

/** Toolbar button trigger + overlay drawer for samples. */
export const SamplesDrawerTrigger: FunctionComponent<SamplesDrawerProps> = ({
  samples,
  emitters,
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
        emitters={emitters}
        onSelectedSampleNameChange={onSelectedSampleNameChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};
