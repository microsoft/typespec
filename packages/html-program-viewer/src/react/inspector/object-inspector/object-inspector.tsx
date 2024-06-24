import type { FC } from "react";
import { memo, useState } from "react";
import { Tree } from "../../tree/tree.js";
import type { TreeNode } from "../../tree/types.js";
import { themeAcceptor } from "../styles/index.js";
import { propertyIsEnumerable } from "../utils/object-prototype.js";
import { getPropertyValue } from "../utils/property-utils.js";
import { ObjectLabel } from "./object-label.js";
import { ObjectRootLabel } from "./object-root-label.js";

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

const defaultNodeRenderer = ({ path, name, data, isNonenumerable }: NodeRendererProps) =>
  path === "$" ? (
    <ObjectRootLabel name={name} data={data} />
  ) : (
    <ObjectLabel name={name} data={data} isNonenumerable={isNonenumerable} />
  );

export interface ObjectInspectorProps {
  readonly data: any;
  readonly showNonenumerable?: boolean;
  readonly sortObjectKeys?: boolean | ((a: string, b: string) => number);
  readonly nodeRenderer?: (props: NodeRendererProps) => any;
}

const ObjectInspector: FC<ObjectInspectorProps> = ({
  data,
  showNonenumerable = false,
  sortObjectKeys,
  nodeRenderer,
}) => {
  const dataIterator = createIterator(showNonenumerable, sortObjectKeys);
  const renderer = nodeRenderer ?? defaultNodeRenderer;

  return <TreeView nodeRenderer={renderer} dataIterator={dataIterator} data={data} />;
};

const themedObjectInspector = themeAcceptor(ObjectInspector);

export { themedObjectInspector as ObjectInspector };

export const DEFAULT_ROOT_PATH = "$";

export function hasChildNodes(data: any, dataIterator: any) {
  return !dataIterator(data).next().done;
}

export interface NodeRendererProps {
  readonly name: string | undefined;
  readonly path: string;
  readonly data: any;
  readonly isNonenumerable?: boolean;
}

interface TreeViewProps {
  data: any;
  dataIterator: (...args: any[]) => any;
  nodeRenderer: (props: NodeRendererProps) => any;
}
const TreeView = memo(({ data, nodeRenderer, dataIterator }: TreeViewProps) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set<string>());

  const tree = computeNode({
    path: DEFAULT_ROOT_PATH,
    name: "root",
    data,
    dataIterator,
    nodeRenderer,
    expandedPaths,
  });
  return (
    <Tree
      tree={{ id: "", name: "", children: [tree] }}
      onSetExpanded={(x) => setExpandedPaths(new Set(x))}
    />
  );
});

interface ComputeNodeOptions {
  expandedPaths: Set<string>;
  name: string;
  data: any;
  path: string;
  dataIterator: (...args: any[]) => any;
  nodeRenderer: (props: NodeRendererProps) => any;
}

function computeNode({
  expandedPaths,
  path,
  data,
  dataIterator,
  ...props
}: ComputeNodeOptions): TreeNode {
  const expanded = expandedPaths.has(path);
  const nodeHasChildNodes = hasChildNodes(data, dataIterator);
  return {
    id: path,
    name: (
      <props.nodeRenderer
        name={props.name === "root" ? undefined : props.name}
        data={data}
        isNonenumerable={false}
        path={path}
      />
    ),
    hasMore: nodeHasChildNodes,
    children: expanded
      ? [...dataIterator(data)].map(({ name, data }) => {
          return computeNode({
            path: `${path}.${name}`,
            name,
            data,
            nodeRenderer: props.nodeRenderer,
            dataIterator,
            expandedPaths,
          });
        })
      : [],
  };
}
