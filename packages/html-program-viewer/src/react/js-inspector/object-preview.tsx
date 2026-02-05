import React, { type FC, type ReactNode } from "react";

import { JsValue } from "./js-value/js-value.js";
import { ObjectName } from "./object-name.js";

import style from "./object-inspector.module.css";
import { hasOwnProperty, propertyIsEnumerable } from "./utils/object-prototype.js";
import { getPropertyValue } from "./utils/property-utils.js";

/* intersperse arr with separator */
function intersperse(arr: any[], sep: string) {
  if (arr.length === 0) {
    return [];
  }

  return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}

const ARRAY_MAX_PROPERTIES = 10;
const OBJECT_MAX_PROPERTIES = 5;

/**
 * A preview of the object
 */
export const ObjectPreview: FC<any> = ({ data }) => {
  const object = data;

  if (
    typeof object !== "object" ||
    object === null ||
    object instanceof Date ||
    object instanceof RegExp
  ) {
    return <JsValue value={object} />;
  }

  if (Array.isArray(object)) {
    const maxProperties = ARRAY_MAX_PROPERTIES;
    const previewArray = object
      .slice(0, maxProperties)
      .map((element, index) => <JsValue key={index} value={element} />);
    if (object.length > maxProperties) {
      previewArray.push(<span key="ellipsis">…</span>);
    }
    const arrayLength = object.length;
    return (
      <React.Fragment>
        <span className={style["object-description"]}>
          {arrayLength === 0 ? `` : `(${arrayLength})\xa0`}
        </span>
        <span className={style["preview"]}>[{intersperse(previewArray, ", ")}]</span>
      </React.Fragment>
    );
  } else {
    const maxProperties = OBJECT_MAX_PROPERTIES;
    const propertyNodes: ReactNode[] = [];
    
    // Get all property keys (both string and Symbol), filtering for enumerable ones
    const stringKeys = Object.keys(object); // Object.keys only returns enumerable string properties
    const symbolKeys = Object.getOwnPropertySymbols(object).filter(sym => 
      propertyIsEnumerable.call(object, sym)
    );
    const allKeys: (string | symbol)[] = [...stringKeys, ...symbolKeys];
    const totalProperties = allKeys.length;
    
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      let ellipsis;
      if (
        propertyNodes.length === maxProperties - 1 &&
        totalProperties > maxProperties
      ) {
        ellipsis = <span key={"ellipsis"}>…</span>;
      }

      const propertyValue = getPropertyValue(object, key);
      const displayName = typeof key === "string" ? key || `""` : key.toString();
      propertyNodes.push(
        <span key={typeof key === "string" ? key : `symbol-${i}`}>
          <ObjectName name={displayName} />
          :&nbsp;
          <JsValue value={propertyValue} />
          {ellipsis}
        </span>,
      );
      if (ellipsis) break;
    }

    const objectConstructorName = object.constructor ? object.constructor.name : "Object";

    return (
      <React.Fragment>
        <span className={style["object-description"]}>
          {objectConstructorName === "Object" ? "" : `${objectConstructorName} `}
        </span>
        <span className={style["preview"]}>
          {"{"}
          {intersperse(propertyNodes, ", ")}
          {"}"}
        </span>
      </React.Fragment>
    );
  }
};
