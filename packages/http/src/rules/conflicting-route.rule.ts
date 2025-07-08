import { createRule, paramMessage } from "@typespec/compiler";
import { getAllHttpServices } from "../operations.js";
import { HttpOperation } from "../types.js";

export const conflictingRouteRule = createRule({
  name: "conflicting-route",
  severity: "warning",
  description: "Check no 2 operations without @sharedRoute have path that might be ambiguous.",
  url: "https://typespec.io/docs/libraries/http/rules/conflicting-route",
  messages: {
    default: paramMessage`Operations have conflicting routes. These operations could match the same URLs: ${"operations"} (routes: ${"uriTemplate"})`,
  },
  create(context) {
    return {
      root: (program) => {
        const [services, _] = getAllHttpServices(program);
        for (const service of services) {
          const conflicts = findConflictingRoutes(service.operations);

          for (const conflictingOps of conflicts) {
            // Get the operation names for the error message
            const operationNames = conflictingOps.map((op) => op.operation.name).join(", ");

            // Use the actual templates instead of normalized ones to show the real conflict
            const templates = conflictingOps.map((op) => op.uriTemplate).join(", ");

            // Report diagnostic on each conflicting operation
            for (const operation of conflictingOps) {
              context.reportDiagnostic({
                target: operation.operation,
                format: {
                  uriTemplate: templates,
                  operations: operationNames,
                },
              });
            }
          }
        }
      },
    };
  },
});

function findConflictingRoutes(operations: HttpOperation[]): HttpOperation[][] {
  const conflicts: HttpOperation[][] = [];

  // Group operations by HTTP verb first
  const verbGroups = new Map<string, HttpOperation[]>();
  for (const operation of operations) {
    const verb = operation.verb;
    const existing = verbGroups.get(verb);
    if (existing) {
      existing.push(operation);
    } else {
      verbGroups.set(verb, [operation]);
    }
  }

  // Check for conflicts within each verb group using a route tree
  for (const operations of verbGroups.values()) {
    if (operations.length < 2) continue;

    const routeTree = new RouteTree();

    // Add each route to the tree and collect conflicts
    for (const operation of operations) {
      const conflictingOps = routeTree.addRoute(operation);
      if (conflictingOps.length > 0) {
        // Found conflict with existing routes
        const allConflicted = [operation, ...conflictingOps];

        // Check if any of these operations are already in a conflict group
        const existingGroup = conflicts.find((group) =>
          allConflicted.some((op) => group.includes(op)),
        );

        if (existingGroup) {
          // Merge with existing group
          for (const op of allConflicted) {
            if (!existingGroup.includes(op)) {
              existingGroup.push(op);
            }
          }
        } else {
          // Create new conflict group
          conflicts.push(allConflicted);
        }
      }
    }
  }

  return conflicts;
}

/**
 * A route tree (trie) that detects conflicting routes as they are added.
 * Each node represents a path segment, and conflicts occur when:
 * - A parameter segment conflicts with a literal segment at the same position
 * - Multiple operations end at the same leaf node
 */
class RouteTree {
  private root = new RouteNode();

  /**
   * Adds a route to the tree and returns any conflicting operations.
   */
  addRoute(operation: HttpOperation): HttpOperation[] {
    const segments = parseUriTemplate(operation.uriTemplate);
    return this.root.addOperation(operation, segments, 0);
  }
}

class RouteNode {
  // Literal children: exact string matches
  private literalChildren = new Map<string, RouteNode>();

  // Parameter child: matches any segment (only one allowed per node)
  private parameterChild: RouteNode | null = null;

  // Operations that terminate at this node
  private operations: HttpOperation[] = [];

  addOperation(
    operation: HttpOperation,
    segments: Array<{ type: "literal" | "parameter"; value: string }>,
    index: number,
  ): HttpOperation[] {
    // If we've consumed all segments, this operation ends here
    if (index >= segments.length) {
      const conflicts = [...this.operations]; // Copy existing operations as they conflict
      this.operations.push(operation);
      return conflicts;
    }

    const segment = segments[index];
    const conflicts: HttpOperation[] = [];

    if (segment.type === "literal") {
      // Literal segment
      const literalValue = segment.value;

      // Check for conflict with parameter child
      if (this.parameterChild) {
        // Parameter child can match this literal, so there's a conflict
        conflicts.push(...this.collectAllOperations(this.parameterChild));
      }

      // Get or create literal child
      let childNode = this.literalChildren.get(literalValue);
      if (!childNode) {
        childNode = new RouteNode();
        this.literalChildren.set(literalValue, childNode);
      }

      // Continue with this literal child
      const childConflicts = childNode.addOperation(operation, segments, index + 1);
      conflicts.push(...childConflicts);
    } else {
      // Parameter segment

      // Check for conflicts with all literal children (parameter can match any literal)
      for (const literalChild of this.literalChildren.values()) {
        conflicts.push(...this.collectAllOperations(literalChild));
      }

      // Get or create parameter child
      if (!this.parameterChild) {
        this.parameterChild = new RouteNode();
      }

      // Continue with parameter child
      const childConflicts = this.parameterChild.addOperation(operation, segments, index + 1);
      conflicts.push(...childConflicts);
    }

    return conflicts;
  }

  /**
   * Recursively collect all operations from this node and its descendants.
   */
  private collectAllOperations(node: RouteNode): HttpOperation[] {
    const operations = [...node.operations];

    // Add operations from literal children
    for (const child of node.literalChildren.values()) {
      operations.push(...this.collectAllOperations(child));
    }

    // Add operations from parameter child
    if (node.parameterChild) {
      operations.push(...this.collectAllOperations(node.parameterChild));
    }

    return operations;
  }
}

/**
 * Parses a URI template into segments, identifying literals vs parameters.
 */
function parseUriTemplate(
  template: string,
): Array<{ type: "literal" | "parameter"; value: string }> {
  // Remove query and fragment parts for path comparison
  const pathPart = template.split(/[?#]/)[0];

  // Split by / and filter out empty segments
  const rawSegments = pathPart.split("/").filter((seg) => seg.length > 0);

  return rawSegments.map((segment) => {
    if (segment.startsWith("{") && segment.endsWith("}")) {
      return { type: "parameter", value: segment };
    } else {
      return { type: "literal", value: segment };
    }
  });
}
