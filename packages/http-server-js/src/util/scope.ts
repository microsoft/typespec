import { DiagnosticTarget, NoTarget } from "@typespec/compiler";
import { JsContext } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { UnreachableError } from "./error.js";

/**
 * A conceptual lexical scope.
 */
export interface Scope {
  /**
   * Declare a name in the scope, applying the appropriate resolution strategy if necessary.
   *
   * @param primaryName - the primary name we want to declare in this scope
   * @param options - options for the declaration
   * @returns the name that was finally declared in the scope
   */
  declare(primaryName: string, options?: DeclarationOptions): string;

  /**
   * Determines whether or not a given name is declared in the scope.
   *
   * @param name - the name to check for declaration
   */
  isDeclared(name: string): boolean;
}

export interface DeclarationOptions {
  /**
   * The source of the declaration, to be used when raising diagnostics.
   *
   * Default: NoTarget
   */
  source?: DiagnosticTarget | typeof NoTarget;
  /**
   * The resolution strategy to use if the declared name conflicts with an already declared name.
   *
   * Default: "shadow"
   */
  resolutionStrategy?: ResolutionStrategy;
}

const DEFAULT_DECLARATION_OPTIONS: Required<DeclarationOptions> = {
  source: NoTarget,
  resolutionStrategy: "shadow",
};

/**
 * A strategy to use when attempting to resolve naming conflicts. This can be one of the following types:
 *
 * - `none`: no attempt will be made to resolve the naming conflict.
 * - `shadow`: if the scope does not directly declare the name, this declaration will shadow it.
 * - `prefix`: if the name is already declared, a prefix will be added to the name to resolve the conflict.
 * - `alt-name`: if the name is already declared, an alternative name will be used to resolve the conflict.
 */
export type ResolutionStrategy = PrefixResolution | AltNameResolution | "shadow" | "none";

/**
 * A resolution strategy that prepends a prefix.
 */
export interface PrefixResolution {
  kind: "prefix";
  /**
   * The prefix to append to the name.
   *
   * Default: "_".
   */
  prefix?: string;
  /**
   * Whether or not to repeat the prefix until the conflict is resolved.
   */
  repeated?: boolean;
  /**
   * Whether or not the name should shadow existing declarations.
   *
   * This setting applies to the primary name as well, so if the primary name is not own-declared in the scope, no
   * prefix will be added.
   */
  shadow?: boolean;
}

/**
 * A resolution strategy that attempts to use an alternative name to resolve conflicts.
 */
export interface AltNameResolution {
  kind: "alt-name";
  /**
   * The alternative name for this declaration.
   */
  altName: string;
}

const NO_PARENT: Scope = {
  declare() {
    throw new UnreachableError("Cannot declare in the no-parent scope");
  },
  isDeclared() {
    return false;
  },
};

/**
 * Create a new scope.
 *
 * @param ctx - the JS emitter context.
 * @param parent - an optional parent scope for this scope. It will consider declarations in the parent scope for some conflicts.
 */
export function createScope(ctx: JsContext, parent: Scope = NO_PARENT): Scope {
  const ownDeclarations: Set<string> = new Set();
  const self: Scope = {
    declare(primaryName, options = {}) {
      const { source: target, resolutionStrategy } = { ...DEFAULT_DECLARATION_OPTIONS, ...options };

      if (!self.isDeclared(primaryName)) {
        ownDeclarations.add(primaryName);
        return primaryName;
      }

      // Apply resolution strategy
      const resolutionStrategyName =
        typeof resolutionStrategy === "string" ? resolutionStrategy : resolutionStrategy.kind;

      switch (resolutionStrategyName) {
        case "none":
          // Report diagnostic and return the name as is.
          reportDiagnostic(ctx.program, {
            code: "name-conflict",
            format: {
              name: primaryName,
            },
            target,
          });
          return primaryName;
        case "shadow":
          // Check to make sure this name isn't an own-declaration, and if not allow it, otherwise raise a diagnostic.
          if (!ownDeclarations.has(primaryName)) {
            ownDeclarations.add(primaryName);
            return primaryName;
          } else {
            reportDiagnostic(ctx.program, {
              code: "name-conflict",
              format: {
                name: primaryName,
              },
              target,
            });
            return primaryName;
          }
        case "prefix": {
          const {
            prefix = "_",
            repeated = false,
            shadow = true,
          } = resolutionStrategy as PrefixResolution;
          let name = primaryName;

          const isDeclared = shadow ? (name: string) => ownDeclarations.has(name) : self.isDeclared;

          while (isDeclared(name)) {
            name = prefix + name;

            if (!repeated) break;
          }

          if (isDeclared(name)) {
            // We were not able to resolve the conflict with this strategy, so raise a diagnostic.
            reportDiagnostic(ctx.program, {
              code: "name-conflict",
              format: {
                name: name,
              },
              target,
            });

            return name;
          }

          ownDeclarations.add(name);
          return name;
        }
        case "alt-name": {
          const { altName } = resolutionStrategy as AltNameResolution;

          if (!self.isDeclared(altName)) {
            ownDeclarations.add(altName);
            return altName;
          }

          // We were not able to resolve the conflict with this strategy, so raise a diagnostic.
          reportDiagnostic(ctx.program, {
            code: "name-conflict",
            format: {
              name: altName,
            },
            target,
          });

          return altName;
        }
        default:
          throw new UnreachableError(`Unknown resolution strategy: ${resolutionStrategy}`, {
            resolutionStrategyName,
          });
      }
    },
    isDeclared(name) {
      return ownDeclarations.has(name) || parent.isDeclared(name);
    },
  };

  return self;
}
