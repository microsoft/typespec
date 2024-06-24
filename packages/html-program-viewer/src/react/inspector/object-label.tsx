import type { FC } from "react";
import { ObjectName } from "./object-name.js";
import { ObjectPreview } from "./object-preview.js";
import { ObjectValue } from "./object-value.js";

export interface ObjectLabelProps {
  readonly name: any;
  readonly data: any;
  readonly isNonenumerable?: boolean;
}
/**
 * if isNonenumerable is specified, render the name dimmed
 */
export const ObjectLabel: FC<ObjectLabelProps> = ({ name, data, isNonenumerable = false }) => {
  const object = data;

  return (
    <span>
      {typeof name === "string" ? (
        <ObjectName name={name} dimmed={isNonenumerable} />
      ) : (
        <ObjectPreview data={name} />
      )}
      <span>: </span>
      <ObjectValue object={object} />
    </span>
  );
};
