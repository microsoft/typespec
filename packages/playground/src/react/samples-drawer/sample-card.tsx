import { Card, Text } from "@fluentui/react-components";
import { useCallback, useMemo, type FunctionComponent, type MouseEvent } from "react";
import type { PlaygroundSample, PlaygroundTspLibrary } from "../../types.js";
import { getEmitterDisplayName, resolveCompatibleEmitters } from "../emitter-utils.js";
import { SampleIcon } from "./sample-icon.js";
import style from "./samples-drawer.module.css";

export interface SampleCardProps {
  name: string;
  sample: PlaygroundSample;
  emitters: Record<string, PlaygroundTspLibrary>;
  onSelect: (name: string, emitter?: string) => void;
}

export const SampleCard: FunctionComponent<SampleCardProps> = ({
  name,
  sample,
  emitters,
  onSelect,
}) => {
  const compatibleEmitters = useMemo(
    () => resolveCompatibleEmitters(sample, emitters),
    [sample, emitters],
  );

  const handleCardClick = useCallback(() => {
    onSelect(name);
  }, [name, onSelect]);

  const handleEmitterClick = useCallback(
    (e: MouseEvent, emitter: string) => {
      e.stopPropagation();
      onSelect(name, emitter);
    },
    [name, onSelect],
  );

  return (
    <Card
      className={style["sample-card"]}
      onClick={handleCardClick}
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
          {compatibleEmitters.length > 0 && (
            <div className={style["emitter-badges"]}>
              {compatibleEmitters.map((emitter) => (
                <button
                  key={emitter}
                  className={style["emitter-badge-button"]}
                  onClick={(e) => handleEmitterClick(e, emitter)}
                  title={`Open with ${getEmitterDisplayName(emitter)}`}
                  aria-label={`Open sample "${name}" with ${getEmitterDisplayName(emitter)}`}
                >
                  {getEmitterDisplayName(emitter)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
