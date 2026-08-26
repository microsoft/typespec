import { For, Prose } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { TypekitNamespace } from "../typekit-docs.js";
import { TsDoc } from "./tsdoc.jsx";
import { TypekitFunction } from "./typekit-function.jsx";

export interface TypekitSectionProps {
  readonly typekit: TypekitNamespace;
}

export function TypekitSection(props: TypekitSectionProps) {
  return (
    <md.Section heading={props.typekit.name}>
      <Prose>{props.typekit.doc && <TsDoc node={props.typekit.doc} />}</Prose>
      <For each={Object.values(props.typekit.entries)}>
        {(x) => <TypekitFunction typekit={x as any} />}
      </For>
    </md.Section>
  );
}
