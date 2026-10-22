import type { MemberType, Scalar } from "@typespec/compiler";
import {
  SimpleScalarMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { reportDiagnostic } from "../../lib.js";
import { applyTypeNamePipeline } from "../../lib/naming.js";
import { getScalarMapping, isStdScalar } from "../../lib/scalar-mappings.js";
import { getSpecifiedBy, setSpecifiedByUrl } from "../../lib/specified-by.js";

/**
 * GraphQL built-in scalar type names.
 * @see https://spec.graphql.org/September2025/#sec-Scalars.Built-in-Scalars
 */
const GRAPHQL_BUILTIN_SCALARS = new Set(["String", "Int", "Float", "Boolean", "ID"]);

/**
 * Check whether a scalar is the GraphQL library's `ID` scalar, or extends it.
 * Walks the baseScalar chain looking for a scalar named "ID" in the
 * TypeSpec.GraphQL namespace.
 */
function isGraphQLIdScalar(scalar: Scalar): boolean {
  let current: Scalar | undefined = scalar;
  while (current) {
    if (
      current.name === "ID" &&
      current.namespace?.name === "GraphQL" &&
      current.namespace?.namespace?.name === "TypeSpec"
    ) {
      return true;
    }
    current = current.baseScalar;
  }
  return false;
}

/** Normalizes custom scalars and preserves specification URLs for GraphQL emission. */
export class GraphQLScalarMutation extends SimpleScalarMutation<SimpleMutationOptions> {
  /**
   * Initializes a scalar transformation using the engine's references and cache
   * identity. Prefer `GraphQLMutationEngine.mutateScalar` to obtain the
   * cached transformation for a program.
   */
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /**
   * Removes the base scalar from the mutated type. GraphQL scalars have no
   * inheritance, so the emitted scalar must not extend anything.
   *
   * This must run after `mutationNode.mutate()` rather than inside its
   * initializer: the mutation node calls `finishType` on the clone, which
   * re-runs the source scalar's decorators. Compiler decorators such as
   * `@pattern`, `@minLength`, and `@format` validate their target against the
   * base scalar chain (e.g. "is assignable to string") and would report
   * `decorator-wrong-target` if the base were already gone.
   */
  private stripBaseScalar() {
    this.mutationNode.mutatedType.baseScalar = undefined;
  }

  /**
   * Maps GraphQL ID descendants to ID and normalizes custom scalar names,
   * removing their base scalar once the clone's decorators have been
   * validated. Standard TypeSpec scalars keep their names for mapping at
   * emission time. Explicit specification URLs take precedence over URLs
   * inherited from the scalar mapping table.
   */
  mutate() {
    const tk = this.engine.$;
    const program = tk.program;
    const mapping = getScalarMapping(program, this.sourceType);

    if (isGraphQLIdScalar(this.sourceType)) {
      // GraphQL library scalar ID (or extends it) → built-in GraphQL ID type
      this.mutationNode.mutate((scalar) => {
        scalar.name = "ID";
      });
      this.stripBaseScalar();
    } else {
      if (!isStdScalar(tk, this.sourceType)) {
        // User-defined custom scalar — sanitize name, strip extends.
        // May still have a mapping via extends chain (e.g. scalar MyInt extends int64),
        // which is used for @specifiedBy below but not for renaming.
        const finalName = applyTypeNamePipeline(this.sourceType.name, {
          isInput: false,
          isInterface: false,
        });
        if (GRAPHQL_BUILTIN_SCALARS.has(finalName)) {
          reportDiagnostic(program, {
            code: "graphql-builtin-scalar-collision",
            target: this.sourceType,
            format: { name: this.sourceType.name, builtinName: finalName },
          });
        }
        this.mutationNode.mutate((scalar) => {
          scalar.name = finalName;
        });
        this.stripBaseScalar();
      }
      // else: Built-in std scalars (string, boolean, int32, etc.) are left untouched —
      // they map to GraphQL built-in types and are resolved at emit time.
    }

    // Apply @specifiedBy: explicit decorator on source wins, then mapping table
    // (mapping may come from an ancestor via the extends chain)
    const specUrl = getSpecifiedBy(program, this.sourceType) ?? mapping?.specificationUrl;
    if (specUrl) {
      setSpecifiedByUrl(program, this.mutatedType, specUrl);
    }

    super.mutate();
  }
}
