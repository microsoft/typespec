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

/** GraphQL-specific Scalar mutation */
export class GraphQLScalarMutation extends SimpleScalarMutation<SimpleMutationOptions> {
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  mutate() {
    const tk = this.engine.$;
    const program = tk.program;
    const mapping = getScalarMapping(program, this.sourceType);

    if (isGraphQLIdScalar(this.sourceType)) {
      // GraphQL library scalar ID (or extends it) → built-in GraphQL ID type
      this.mutationNode.mutate((scalar) => {
        scalar.name = "ID";
        scalar.baseScalar = undefined;
      });
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
          scalar.baseScalar = undefined;
        });
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
