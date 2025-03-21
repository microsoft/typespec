import { ModelProperty } from "@typespec/compiler";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { usePropertyAccessPolicy } from "../context/property-access-policy-context.js";
import { PropertyMetadata } from "../property-access-policy.js";

export interface ParameterTreeNode {
  name: string | number;
  property: ModelProperty;
  httpProperty: HttpProperty;
  optional: boolean;
  parent?: ParameterTreeNode;
  children: ParameterTreeNode[];
}

export interface OperationTreeState {
  roots: ParameterTreeNode[];
  nodeMap: Map<HttpProperty, ParameterTreeNode>;
  parentMap: Map<ModelProperty, ModelProperty>;
}

const treeCache = new Map<HttpOperation, OperationTreeState>();

export function buildParameterTree(httpOp: HttpOperation): OperationTreeState {
  if (treeCache.has(httpOp)) return treeCache.get(httpOp)!;

  const roots = new Map<string | number, ParameterTreeNode>();
  const nodeMap = new Map<HttpProperty, ParameterTreeNode>();
  const parentMap = new Map<ModelProperty, ModelProperty>();

  for (const httpProp of httpOp.parameters.properties) {
    const { path, property } = httpProp;
    let current: ParameterTreeNode;

    const rootName = path[0];
    if (!roots.has(rootName)) {
      const rootNode: ParameterTreeNode = {
        name: rootName,
        property,
        httpProperty: httpProp,
        optional: path.length === 1 ? property.optional : false,
        children: [],
      };
      roots.set(rootName, rootNode);
    }

    current = roots.get(rootName)!;

    for (let i = 1; i < path.length; i++) {
      const segment = path[i];
      let child = current.children.find((c) => c.name === segment);
      if (!child) {
        const isLeaf = i === path.length - 1;
        child = {
          name: segment,
          property: isLeaf ? property : ({} as ModelProperty),
          httpProperty: httpProp,
          optional: isLeaf ? property.optional : false,
          parent: current,
          children: [],
        };
        current.children.push(child);
      }

      if (i === path.length - 1) {
        parentMap.set(property, current.property);
      } else if (i > 0 && current.property) {
        if (current.parent?.property) {
          parentMap.set(current.property, current.parent.property);
        }
      }

      current = child;
    }

    nodeMap.set(httpProp, current);
  }

  const result = {
    roots: Array.from(roots.values()),
    nodeMap,
    parentMap,
  };

  treeCache.set(httpOp, result);
  return result;
}

export function getOperationParameters(httpOp: HttpOperation): HttpProperty[] {
  return buildParameterTree(httpOp).roots.map((n) => n.httpProperty);
}

export function resolveOperationParameter(
  httpOperation: HttpOperation,
  httpProp: HttpProperty,
): string {
  const tree = buildParameterTree(httpOperation);
  const node = tree.nodeMap.get(httpProp);
  if (!node) throw new Error("HttpProperty not found.");

  const policy = usePropertyAccessPolicy();
  const { path, property } = httpProp;

  if (path.length === 1) {
    return policy.getTopLevelAccess(httpProp);
  }

  const fullPath = collectAccessPathWithOptionality(property, path, tree.parentMap);
  const root = fullPath[0];
  const tail = fullPath.slice(1);

  return policy.getNestedAccess(root, tail);
}

function collectAccessPathWithOptionality(
  property: ModelProperty,
  path: (string | number)[],
  parentMap: Map<ModelProperty, ModelProperty>,
): PropertyMetadata[] {
  const result: PropertyMetadata[] = [];
  let current = property;

  for (let i = path.length - 1; i >= 0; i--) {
    const parent = parentMap.get(current);

    result.unshift({
      name: path[i],
      property: current,
      parent,
    });
    if (!parent) break;
    current = parent;
  }

  return result;
}
