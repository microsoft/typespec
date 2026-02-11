import { Card, Text } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { PlaygroundSample } from "../../types.js";
import { SampleIcon } from "./sample-icon.js";
import style from "./samples-drawer.module.css";

export interface SampleCardProps {
  name: string;
  sample: PlaygroundSample;
  onSelect: (name: string) => void;
}

export const SampleCard: FunctionComponent<SampleCardProps> = ({ name, sample, onSelect }) => {
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
