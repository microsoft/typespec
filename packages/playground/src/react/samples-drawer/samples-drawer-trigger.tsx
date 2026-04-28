import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  SearchBox,
  Text,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { Dismiss24Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
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

interface SampleCategory {
  name: string;
  entries: [string, PlaygroundSample][];
}

function groupAndFilterSamples(
  samples: Record<string, PlaygroundSample>,
  searchQuery: string,
): SampleCategory[] {
  const query = searchQuery.toLowerCase().trim();
  const categoryMap = new Map<string, [string, PlaygroundSample][]>();

  for (const [name, sample] of Object.entries(samples)) {
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
  onSelectedSampleNameChange,
  open,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSampleSelect = useCallback(
    (sampleName: string) => {
      onSelectedSampleNameChange(sampleName);
      onOpenChange(false);
    },
    [onSelectedSampleNameChange, onOpenChange],
  );

  const categories = useMemo(
    () => groupAndFilterSamples(samples, searchQuery),
    [samples, searchQuery],
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
        if (!data.open) setSearchQuery("");
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
                <SampleCard key={name} name={name} sample={sample} onSelect={handleSampleSelect} />
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
