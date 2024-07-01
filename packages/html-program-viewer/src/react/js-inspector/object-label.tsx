import type { FC, ReactNode } from "react";
import { ObjectName } from "./object-name.js";
import { ObjectPreview } from "./object-preview.js";

export interface ObjectLabelProps {
  readonly name: any;
  readonly isNonenumerable?: boolean;
  readonly children: ReactNode;
}
/**
 * if isNonenumerable is specified, render the name dimmed
 */
export const ObjectLabel: FC<ObjectLabelProps> = ({ name, children, isNonenumerable = false }) => {
  return (
    <span>
      {typeof name === "string" ? (
        <ObjectName name={name} dimmed={isNonenumerable} />
      ) : (
        <ObjectPreview data={name} />
      )}
      <span>: </span>
      {children}
    </span>
  );
};
