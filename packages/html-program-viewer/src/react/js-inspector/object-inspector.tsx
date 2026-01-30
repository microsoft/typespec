import { Tree, type TreeNode } from "@typespec/react-components";
import type { FC } from "react";
import { useState } from "react";
import { JsValue } from "./js-value/js-value.js";
import { ObjectLabel } from "./object-label.js";
import { ObjectRootLabel } from "./object-root-label.js";
import { propertyIsEnumerable } from "./utils/object-prototype.js";
import { getPropertyValue } from "./utils/property-utils.js";

const createIterator = (showNonenumerable?: boolean, sortObjectKeys?: boolean) => {
  // Helper function to handle property iteration for both string and Symbol keys
  function* iterateProperties(
    data: any,
    keys: (string | symbol)[],
    formatKey: (key: string | symbol) => string = (k) =>
      typeof k === "string" ? k || `""` : k.toString(),
  ) {
    for (const key of keys) {
      if (propertyIsEnumerable.call(data, key)) {
        const propertyValue = getPropertyValue(data, key);
        yield {
          name: formatKey(key),
          data: propertyValue,
        };
      } else if (showNonenumerable) {
        // To work around the error (happens some time when propertyName === 'caller' || propertyName === 'arguments')
        // 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context
        // http://stackoverflow.com/questions/31921189/caller-and-arguments-are-restricted-function-properties-and-cannot-be-access
        let propertyValue;
        try {
          propertyValue = getPropertyValue(data, key);
        } catch (e) {
          // console.warn(e)
        }

        if (propertyValue !== undefined) {
          yield {
            name: formatKey(key),
            data: propertyValue,
            isNonenumerable: true,
          };
        }
      }
    }
  }

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
      // String property names
      const keys = Object.getOwnPropertyNames(data);
      if (sortObjectKeys === true && !dataIsArray) {
        // Array keys should not be sorted in alphabetical order
        keys.sort();
      } else if (typeof sortObjectKeys === "function") {
        keys.sort(sortObjectKeys);
      }

      yield* iterateProperties(data, keys);

      // Symbol property names
      const symbolKeys = Object.getOwnPropertySymbols(data);
      if (sortObjectKeys && !dataIsArray) {
        // Sort symbols by their description for consistent display
        symbolKeys.sort((a, b) => a.toString().localeCompare(b.toString()));
      }
      yield* iterateProperties(data, symbolKeys);

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

export const DefaultNodeRenderer = ({ path, name, data, isNonenumerable }: NodeRendererProps) =>
  path === DEFAULT_ROOT_PATH ? (
    <ObjectRootLabel name={name} data={data} />
  ) : (
    <ObjectLabel name={name} isNonenumerable={isNonenumerable}>
      <JsValue value={data} />
    </ObjectLabel>
  );

export interface ObjectInspectorProps {
  readonly data: any;
  readonly showNonenumerable?: boolean;
  readonly sortObjectKeys?: boolean;
  readonly nodeRenderer?: (props: NodeRendererProps) => any;
}

export const ObjectInspector: FC<ObjectInspectorProps> = ({
  data,
  showNonenumerable = false,
  sortObjectKeys,
  nodeRenderer,
}) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set<string>());
  const dataIterator = createIterator(showNonenumerable, sortObjectKeys);
  const renderer = nodeRenderer ?? DefaultNodeRenderer;

  const tree = computeNode({
    path: DEFAULT_ROOT_PATH,
    name: "root",
    data,
    dataIterator,
    nodeRenderer: renderer,
    expandedPaths,
  });

  return (
    <Tree
      tree={{ id: "", name: "", children: [tree] }}
      onSetExpanded={(x) => setExpandedPaths(new Set(x))}
    />
  );
};

export const DEFAULT_ROOT_PATH = "$";

function hasChildNodes(data: any, dataIterator: any) {
  return !dataIterator(data).next().done;
}

export interface NodeRendererProps {
  readonly name: string | undefined;
  readonly path: string;
  readonly data: any;
  readonly isNonenumerable?: boolean;
}

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
