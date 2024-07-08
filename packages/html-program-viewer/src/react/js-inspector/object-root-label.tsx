import type { FC } from "react";
import { ObjectName } from "./object-name.js";
import { ObjectPreview } from "./object-preview.js";

export const ObjectRootLabel: FC<any> = ({ name, data }) => {
  if (typeof name === "string") {
    return (
      <span>
        <ObjectName name={name} />
        <span>: </span>
        <ObjectPreview data={data} />
      </span>
    );
  } else {
    return <ObjectPreview data={data} />;
  }
};
