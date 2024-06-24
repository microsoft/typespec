import type { FC } from "react";
import { TreeView } from "../tree-view/tree-view.js";

import { ObjectLabel } from "./object-label.js";
import { ObjectRootLabel } from "./object-root-label.js";

import { propertyIsEnumerable } from "../utils/object-prototype.js";
import { getPropertyValue } from "../utils/property-utils.js";

import { themeAcceptor } from "../styles/index.js";

const createIterator = (showNonenumerable: any, sortObjectKeys: any) => {
  const objectIterator = function* (data: any) {
    const shouldIterate = (typeof data === "object" && data !== null) || typeof data === "function";
    if (!shouldIterate) return;

    const dataIsArray = Array.isArray(data);

    // iterable objects (except arrays)
    if (!dataIsArray && data[Symbol.iterator]) {
      let i = 0;
      for (const entry of data) {
        if (Array.isArray(entry) && entry.length === 2) {
          const [k, v] = entry;
          yield {
            name: k,
            data: v,
          };
        } else {
          yield {
            name: i.toString(),
            data: entry,
          };
        }
        i++;
      }
    } else {
      const keys = Object.getOwnPropertyNames(data);
      if (sortObjectKeys === true && !dataIsArray) {
        // Array keys should not be sorted in alphabetical order
        keys.sort();
      } else if (typeof sortObjectKeys === "function") {
        keys.sort(sortObjectKeys);
      }

      for (const propertyName of keys) {
        if (propertyIsEnumerable.call(data, propertyName)) {
          const propertyValue = getPropertyValue(data, propertyName);
          yield {
            name: propertyName || `""`,
            data: propertyValue,
          };
        } else if (showNonenumerable) {
          // To work around the error (happens some time when propertyName === 'caller' || propertyName === 'arguments')
          // 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context
          // http://stackoverflow.com/questions/31921189/caller-and-arguments-are-restricted-function-properties-and-cannot-be-access
          let propertyValue;
          try {
            propertyValue = getPropertyValue(data, propertyName);
          } catch (e) {
            // console.warn(e)
          }

          if (propertyValue !== undefined) {
            yield {
              name: propertyName,
              data: propertyValue,
              isNonenumerable: true,
            };
          }
        }
      }

      // [[Prototype]] of the object: `Object.getPrototypeOf(data)`
      // the property name is shown as "__proto__"
      if (showNonenumerable && data !== Object.prototype /* already added */) {
        yield {
          name: "__proto__",
          data: Object.getPrototypeOf(data),
          isNonenumerable: true,
        };
      }
    }
  };

  return objectIterator;
};

const defaultNodeRenderer = ({ depth, name, data, isNonenumerable }: any) =>
  depth === 0 ? (
    <ObjectRootLabel name={name} data={data} />
  ) : (
    <ObjectLabel name={name} data={data} isNonenumerable={isNonenumerable} />
  );

/**
 * Tree-view for objects
 */
const ObjectInspector: FC<any> = ({
  showNonenumerable = false,
  sortObjectKeys,
  nodeRenderer,
  ...treeViewProps
}) => {
  const dataIterator = createIterator(showNonenumerable, sortObjectKeys);
  const renderer = nodeRenderer ? nodeRenderer : defaultNodeRenderer;

  return <TreeView nodeRenderer={renderer} dataIterator={dataIterator} {...treeViewProps} />;
};

// ObjectInspector.propTypes = {
//   /** An integer specifying to which level the tree should be initially expanded. */
//   expandLevel: PropTypes.number,
//   /** An array containing all the paths that should be expanded when the component is initialized, or a string of just one path */
//   expandPaths: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),

//   name: PropTypes.string,
//   /** Not required prop because we also allow undefined value */
//   data: PropTypes.any,

//   /** Show non-enumerable properties */
//   showNonenumerable: PropTypes.bool,
//   /** Sort object keys with optional compare function. */
//   sortObjectKeys: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),

//   /** Provide a custom nodeRenderer */
//   nodeRenderer: PropTypes.func,
// };

const themedObjectInspector = themeAcceptor(ObjectInspector);

export { themedObjectInspector as ObjectInspector };
