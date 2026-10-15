import { For } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import type { TypekitNamespace } from "../typekit-docs.js";
import { TypekitFunction } from "./typekit-function.jsx";

export interface TypekitSectionProps {
  readonly typekit: TypekitNamespace;
}

export function TypekitSection(props: TypekitSectionProps) {
  return (
    <md.Section heading={props.typekit.name}>
      {props.typekit.doc}
      <For each={Object.values(props.typekit.entries)}>
        {(x) =>
          x.kind === "namespace" ? <TypekitSection typekit={x} /> : <TypekitFunction typekit={x} />
        }
      </For>
    </md.Section>
  );
}
