import { For } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Enum, Namespace, Type, Union } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { EnumDeclaration, efRefkey } from "@typespec/emitter-framework/python";
import { azureCoreModule, coreHttpModule } from "../external-packages/corehttp.js";

/**
 * Returns the CaseInsensitiveEnumMeta reference for the given flavor.
 */
function getCaseInsensitiveEnumMetaRef(flavor: string) {
  if (flavor === "azure") {
    return azureCoreModule["."].CaseInsensitiveEnumMeta;
  }
  return coreHttpModule.utils.CaseInsensitiveEnumMeta;
}

/**
 * Recursively collects all user-defined Enum and enum-like Union types
 * from the TypeSpec program's namespace tree.
 */
function collectEnumTypes(
  ns: Namespace,
  isUserDefined: (t: Type) => boolean,
  isValidEnum: (u: Union) => boolean,
): (Enum | Union)[] {
  const result: (Enum | Union)[] = [];
  for (const e of ns.enums.values()) {
    if (isUserDefined(e)) {
      result.push(e);
    }
  }
  for (const u of ns.unions.values()) {
    if (isUserDefined(u) && isValidEnum(u)) {
      result.push(u);
    }
  }
  for (const sub of ns.namespaces.values()) {
    result.push(...collectEnumTypes(sub, isUserDefined, isValidEnum));
  }
  return result;
}

export interface EnumsProps {
  path?: string;
  /** "azure" or "unbranded" */
  flavor?: string;
}

/**
 * Emits a `_enums.py` file with enum declarations for all Enum and
 * enum-like Union types discovered in the TypeSpec program.
 *
 * Each enum is rendered as:
 *   class Foo(str, Enum, metaclass=CaseInsensitiveEnumMeta): ...
 */
export function Enums(props: EnumsProps) {
  const { $, program } = useTsp();
  const globalNs = program.getGlobalNamespaceType();
  const enumTypes = collectEnumTypes(
    globalNs,
    (t) => $.type.isUserDefined(t),
    (u) => $.union.isValidEnum(u),
  );
  const flavor = props.flavor ?? "unbranded";
  const metaRef = getCaseInsensitiveEnumMetaRef(flavor);

  return (
    <py.SourceFile path={props.path ?? "_enums.py"}>
      <For each={enumTypes} hardline>
        {(type: Enum | Union) => {
          return (
            <EnumDeclaration
              type={type}
              refkey={efRefkey(type)}
              extraBases={["str"]}
              keywords={{ metaclass: metaRef }}
            />
          );
        }}
      </For>
    </py.SourceFile>
  );
}
