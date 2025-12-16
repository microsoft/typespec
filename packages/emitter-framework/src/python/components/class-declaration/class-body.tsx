import { createContentSlot, For, type Children } from "@alloy-js/core";
import { type Interface, type Model, type ModelProperty, type Operation } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { createRekeyableMap } from "@typespec/compiler/utils";
import { useTsp } from "../../../core/context/tsp-context.js";
import { ClassMember } from "./class-member.js";

export interface ClassBodyProps {
  type: Model | Interface;
  abstract?: boolean;
  methodType?: "method" | "class" | "static";
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
  const ContentSlot = createContentSlot();

  // Throw error for models with additional properties (Record-based scenarios)
  if ($.model.is(props.type)) {
    const additionalPropsRecord = $.model.getAdditionalPropertiesRecord(props.type);
    if (additionalPropsRecord) {
      throw new Error("Models with additional properties (Record[…]) are not supported");
    }
  }

  return (
    <>
      <ContentSlot>
        <For each={typeMembers} line>
          {(typeMember) => (
            <ClassMember
              type={typeMember}
              abstract={props.abstract}
              methodType={props.methodType}
            />
          )}
        </For>
        {props.children ?? null}
      </ContentSlot>
      <ContentSlot.WhenEmpty>{undefined}</ContentSlot.WhenEmpty>
    </>
  );
}
