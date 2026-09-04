import { code, type Children } from "@alloy-js/core";
import { isStdNamespace, type Namespace, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { Experimental_ComponentOverridesConfig, useTsp } from "@typespec/emitter-framework";
import type { PropertyProps } from "@typespec/emitter-framework/csharp";
import {
  efRefkey,
  TypeExpression as EfTypeExpression,
  getNullableUnionInnerType,
  isCSharpValueType,
} from "@typespec/emitter-framework/csharp";
import { getUniqueItems } from "@typespec/json-schema";
import { useEmitterOptions } from "../../context/emitter-options-context.js";
import { isUnionEnum } from "../enums/enums.jsx";
import { getAnonymousModelName } from "../models/models.jsx";
import { ServerPropertyOverride } from "../models/server-property.jsx";
import { getServerScalarOverrides } from "./scalar-overrides.js";

export interface TypeExpressionProps {
  type: Type;
}

// Re-export efRefkey for consumers that were using serverRefkey
export { efRefkey } from "@typespec/emitter-framework/csharp";

/**
 * Wrapper around emitter-framework's TypeExpression.
 *
 * Only the cases where the server emitter genuinely diverges from the framework are handled
 * here — union-as-enum resolution, the `collection-type` option, `@uniqueItems`, and the
 * `Record<unknown>` → `JsonObject` mapping. Everything else is delegated to the framework.
 *
 * Note that any type kind the framework resolves by *recursing* into a contained type has to
 * be handled here rather than delegated: the framework recurses into its own
 * `TypeExpression`, so the divergences above would be lost for the nested type. Scalars are
 * the exception — those are redirected through {@link createServerScalarOverrides}, which the
 * framework applies at every level.
 */
export function TypeExpression(props: TypeExpressionProps): Children {
  const { $ } = useTsp();
  const type = props.type;

  switch (type.kind) {
    case "Union":
      return resolveUnionType($, type);
    case "UnionVariant":
      // If this variant belongs to a union-as-enum, resolve to the parent enum type
      if (type.union && isUnionEnum(type.union)) {
        return code`${efRefkey(type.union)}`;
      }
      return <TypeExpression type={type.type} />;
    case "ModelProperty":
      return <TypeExpression type={type.type} />;
    case "EnumMember": {
      // Std-lib enums (e.g. auth `AuthType`) are never emitted, so a reference to one of
      // their members has to fall back to the member's underlying primitive value type.
      if (isInStdLibNamespace(type.enum.namespace)) {
        if (typeof type.value === "number") {
          return Number.isInteger(type.value) ? code`int` : code`double`;
        }
        return code`string`;
      }
      break;
    }
    case "Tuple":
      // A tuple is emitted as a collection of its first element's type.
      if (type.values.length > 0) {
        return <CollectionExpression elementType={type.values[0]} />;
      }
      break;
    case "Model":
      // Handle Record<T> → IDictionary<string, T> or JsonObject for Record<unknown>
      if ($.record.is(type)) {
        const valueType = type.indexer!.value;
        if (valueType.kind === "Intrinsic" && valueType.name === "unknown") {
          return code`JsonObject`;
        }
        return (
          <>
            IDictionary&lt;string, <TypeExpression type={valueType} />
            &gt;
          </>
        );
      }
      // Handle Array<T> → T[] or ISet<T> if @uniqueItems, or IEnumerable<T> if collection-type is enumerable
      if ($.array.is(type)) {
        const elementType = type.indexer!.value;
        if (getUniqueItems($.program, type)) {
          return <SetExpression elementType={elementType} />;
        }
        return <CollectionExpression elementType={elementType} />;
      }
      // Handle anonymous models — use refkey to link to their generated class
      if (type.name === "" && getAnonymousModelName(type)) {
        return code`${efRefkey(type)}`;
      }
      break;
  }

  return <EfTypeExpression type={type} />;
}

/**
 * Renders `ISet<T>`, used for arrays marked with `@uniqueItems`.
 */
export function SetExpression(props: { elementType: Type }): Children {
  return (
    <>
      ISet&lt;
      <TypeExpression type={props.elementType} />
      &gt;
    </>
  );
}

/**
 * Renders a sequence of `elementType` honouring the `collection-type` emitter option:
 * `IEnumerable<T>` when set to `enumerable`, otherwise `T[]`.
 *
 * Byte arrays always stay as `T[]` — they are handled as binary payloads, not sequences.
 */
function CollectionExpression(props: { elementType: Type }): Children {
  const { $ } = useTsp();
  const { collectionType } = useEmitterOptions();
  const elementType = props.elementType;

  const isByteArray =
    elementType.kind === "Scalar" &&
    (elementType.name === "uint8" ||
      elementType.name === "int8" ||
      $.scalar.getStdBase(elementType)?.name === "uint8" ||
      $.scalar.getStdBase(elementType)?.name === "int8");

  if (collectionType === "enumerable" && !isByteArray) {
    return (
      <>
        IEnumerable&lt;
        <TypeExpression type={elementType} />
        &gt;
      </>
    );
  }
  return (
    <>
      <TypeExpression type={elementType} />
      []
    </>
  );
}

/**
 * Returns true when the namespace (or any of its ancestors) is a TypeSpec
 * standard-library namespace. Enums declared under the std library (e.g.
 * `TypeSpec.Http.AuthType`) are never emitted, so references to their members
 * must fall back to a primitive type instead of an (unresolved) enum reference.
 */
function isInStdLibNamespace(namespace: Namespace | undefined): boolean {
  let current = namespace;
  while (current) {
    if (isStdNamespace(current)) return true;
    current = current.namespace;
  }
  return false;
}

function resolveUnionType($: Typekit, union: import("@typespec/compiler").Union): Children {
  // Named unions that qualify as enums should reference the enum type
  if (isUnionEnum(union)) {
    return code`${efRefkey(union)}`;
  }

  // Use emitter-framework's nullable union detection
  const innerType = getNullableUnionInnerType(union);
  if (innerType !== undefined) {
    // null|void-only union → object
    if (innerType.kind === "Intrinsic" && innerType.name === "void") {
      return code`object`;
    }
    // Nullable value type → T?
    if (isCSharpValueType($, innerType)) {
      return (
        <>
          <TypeExpression type={innerType} />?
        </>
      );
    }
    // Nullable reference type or multi-variant nullable → resolve inner type
    return <TypeExpression type={innerType} />;
  }

  // Non-nullable union: check if all variants resolve to the same base kind
  const variants = Array.from(union.variants.values());
  const firstType = variants[0].type;
  const allSameKind = variants.every((v) => {
    if (v.type.kind !== firstType.kind) return false;
    if (v.type.kind === "Scalar" && firstType.kind === "Scalar") {
      const stdBase1 = $.scalar.getStdBase(v.type) ?? v.type;
      const stdBase2 = $.scalar.getStdBase(firstType) ?? firstType;
      return stdBase1.name === stdBase2.name;
    }
    // String/Boolean/Number literals of same kind → same base type
    if (v.type.kind === "String" || v.type.kind === "Boolean" || v.type.kind === "Number") {
      return true;
    }
    return v.type === firstType;
  });

  if (allSameKind) return <TypeExpression type={firstType} />;

  // For mixed types, use object
  return code`object`;
}

// --- Server-specific framework overrides ---

/**
 * Builds the {@link Experimental_ComponentOverridesConfig} the emitter installs at the root.
 *
 * - scalars render the server's C# names (the mapping itself lives in `scalar-overrides.ts`
 *   so that non-rendering call sites resolve the exact same names)
 * - model properties render the way the pre-Alloy emitter declared them
 */
export function createServerOverrides($: Typekit): Experimental_ComponentOverridesConfig {
  const overrides = new Experimental_ComponentOverridesConfig();

  for (const [scalar, csType] of getServerScalarOverrides($)) {
    overrides.forType(scalar, {
      reference: () => code`${csType}` as Children,
    });
  }

  overrides.forTypeKind<"ModelProperty", PropertyProps>("ModelProperty", {
    declaration: ServerPropertyOverride,
  });

  return overrides;
}
