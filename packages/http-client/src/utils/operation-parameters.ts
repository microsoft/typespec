import { ModelProperty } from "@typespec/compiler";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { usePropertyAccessPolicy } from "../context/property-access-policy-context.js";
import { AccessPathSegment } from "../property-access-policy.js";

/**
 * Cache for parameter access paths to avoid redundant computation
 */
const pathCache = new WeakMap<HttpOperation, Map<HttpProperty, string>>();

/**
 * Maps for tracking parent-child relationships between properties
 */
const parentMaps = new WeakMap<HttpOperation, Map<ModelProperty, ModelProperty>>();

/**
 * Resolves the access expression for a parameter property in an operation
 * @param httpOperation - The HTTP operation containing the parameter
 * @param httpProp - The property to resolve access for
 * @returns A string representing how to access the property (e.g. "input.filter")
 */
export function resolvePropertyAccessPath(
  httpOperation: HttpOperation,
  httpProp: HttpProperty,
): string {
  // Check cache first
  let opCache = pathCache.get(httpOperation);
  if (!opCache) {
    opCache = new Map();
    pathCache.set(httpOperation, opCache);
  }
  
  if (opCache.has(httpProp)) return opCache.get(httpProp)!;
  
  // Get or build parent relationships map
  let parentMap = parentMaps.get(httpOperation);
  if (!parentMap) {
    parentMap = buildParentMap(httpOperation);
    parentMaps.set(httpOperation, parentMap);
  }
  
  // Build path metadata
  const segments = buildPropertyPath(httpProp, parentMap);
  
  // Apply access policy to format the path
  const policy = usePropertyAccessPolicy();
  const result = policy.fromatPropertyAccessExpression(httpProp, segments);
  
  // Cache and return result
  opCache.set(httpProp, result);
  return result;
}

/**
 * Builds the parent-child relationship map for an operation's properties
 */
function buildParentMap(httpOp: HttpOperation): Map<ModelProperty, ModelProperty> {
  const parentMap = new Map<ModelProperty, ModelProperty>();
  
  for (const httpProp of httpOp.parameters.properties) {
    const { path, property } = httpProp;
    
    // Skip single segment paths (they have no parent)
    if (path.length <= 1) continue;
    
    // Track immediate parent for each path segment
    for (let i = 1; i < path.length; i++) {
      // Find or create parent property
      const parentSegment = path[i - 1];
      const parentProp = findPropertyByPath(httpOp, path.slice(0, i));
      
      if (parentProp && i === path.length - 1) {
        parentMap.set(property, parentProp);
      }
    }
  }
  
  return parentMap;
}

/**
 * Finds a property by its path segments in an operation
 */
function findPropertyByPath(httpOp: HttpOperation, pathSegments: (string | number)[]): ModelProperty | undefined {
  // Implementation to find a property by path segments
  // This is a simplified placeholder
  for (const prop of httpOp.parameters.properties) {
    if (pathSegmentsEqual(prop.path.slice(0, pathSegments.length), pathSegments)) {
      return prop.property;
    }
  }
  return undefined;
}

/**
 * Compares two path segment arrays for equality
 */
function pathSegmentsEqual(a: (string | number)[], b: (string | number)[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((segment, i) => segment === b[i]);
}

/**
 * Builds the property metadata path from a property to its root
 */
function buildPropertyPath(
  httpProp: HttpProperty, 
  parentMap: Map<ModelProperty, ModelProperty>
): AccessPathSegment[] {
  const { path, property } = httpProp;
  const result: AccessPathSegment[] = [];
  
  // Start with leaf property
  let current: ModelProperty | undefined = property;
  let index = path.length - 1;
  
  // Work backwards from leaf to root
  while (index >= 0) {
    const parent: ModelProperty | undefined = current ? parentMap.get(current) : undefined;
    
    result.unshift({
      segmentName: path[index],
      property: current || ({} as ModelProperty),
      parent,
    });
    
    current = parent;
    index--;
  }
  
  return result;
}
