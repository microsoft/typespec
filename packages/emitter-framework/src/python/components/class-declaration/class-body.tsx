import { For, type Children } from "@alloy-js/core";
import { type Interface, type Model, type ModelProperty, type Operation } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { createRekeyableMap } from "@typespec/compiler/utils";
import { useTsp } from "../../../core/context/tsp-context.js";
import { ClassMember } from "./class-member.js";

/** Type-derived members and appended custom content for an existing Python class scope. */
export interface ClassBodyProps {
  /** Model supplying declared properties (excluding inherited base-model properties), or interface supplying operations. */
  type: Model | Interface;
  /** Abstract flag forwarded to operation members; does not itself add ABC to the enclosing class. */
  abstract?: boolean;
  /** Instance, class, or static method selection forwarded to operation members. */
  methodType?: "method" | "class" | "static";
  /** Extra class content emitted after the source-derived members. */
  children?: Children;
}

/**
 * Gets type members (properties or operations) from a Model or Interface.
 */
function getTypeMembers($: Typekit, type: Model | Interface): (ModelProperty | Operation)[] {
  if ($.model.is(type)) {
    return Array.from($.model.getProperties(type).values());
  } else if (type.kind === "Interface") {
    return Array.from(createRekeyableMap(type.operations).values());
  } else {
    throw new Error("Expected Model or Interface type");
  }
}

/**
 * Renders the body of a class declaration.
 * For models, renders properties as dataclass fields.
 * For interfaces, renders operations as abstract methods.
 * Includes any additional children provided.
 */
export function ClassBody(props: ClassBodyProps): Children {
  const { $ } = useTsp();
  const typeMembers = getTypeMembers($, props.type);

  // Throw error for models with additional properties (Record-based scenarios)
  if ($.model.is(props.type)) {
    const additionalPropsRecord = $.model.getAdditionalPropertiesRecord(props.type);
    if (additionalPropsRecord) {
      throw new Error("Models with additional properties (Record[…]) are not supported");
    }
  }

  return (
    <>
      <For each={typeMembers} line>
        {(typeMember) => (
          <ClassMember type={typeMember} abstract={props.abstract} methodType={props.methodType} />
        )}
      </For>
      {props.children}
    </>
  );
}
