import type { FC } from "react";
import { useStyles } from "../styles/index.js";

/**
 * A view for object property names.
 *
 * If the property name is enumerable (in Object.keys(object)),
 * the property name will be rendered normally.
 *
 * If the property name is not enumerable (`Object.prototype.propertyIsEnumerable()`),
 * the property name will be dimmed to show the difference.
 */
export const ObjectName: FC<any> = ({ name, dimmed = false, styles = {} }) => {
  const themeStyles = useStyles("ObjectName");
  const appliedStyles = {
    ...themeStyles.base,
    ...(dimmed ? themeStyles["dimmed"] : {}),
    ...styles,
  };

  return <span style={appliedStyles}>{name}</span>;
};

// ObjectName.propTypes = {
//   /** Property name */
//   name: PropTypes.string,
//   /** Should property name be dimmed */
//   dimmed: PropTypes.bool,
// };
