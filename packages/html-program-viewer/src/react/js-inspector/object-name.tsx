import { mergeClasses } from "@fluentui/react-components";
import type { FC } from "react";
import style from "./object-inspector.module.css";

export interface ObjectNameProps {
  readonly name: any;
  readonly dimmed?: boolean;
}
/**
 * A view for object property names.
 *
 * If the property name is enumerable (in Object.keys(object)),
 * the property name will be rendered normally.
 *
 * If the property name is not enumerable (`Object.prototype.propertyIsEnumerable()`),
 * the property name will be dimmed to show the difference.
 */
export const ObjectName: FC<ObjectNameProps> = ({ name, dimmed }) => {
  return (
    <span className={mergeClasses(style["object-name"], dimmed && style["dimmed"])}>{name}</span>
  );
};
