import type { FC } from "react";
import { ObjectName } from "../object/object-name.js";
import { ObjectValue } from "../object/object-value.js";
import { ObjectPreview } from "./object-preview.js";

/**
 * if isNonenumerable is specified, render the name dimmed
 */
export const ObjectLabel: FC<any> = ({ name, data, isNonenumerable = false }) => {
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

// ObjectLabel.propTypes = {
//   /** Non enumerable object property will be dimmed */
//   isNonenumerable: PropTypes.bool,
// };
