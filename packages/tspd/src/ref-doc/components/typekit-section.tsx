import * as ay from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { TypekitApi } from "../typekit-docs.js";
import { TsDoc } from "./tsdoc.jsx";
import { TypekitFunction } from "./typekit-function.jsx";

export interface TypekitSectionProps {
  readonly typekit: TypekitApi;
}

export function TypekitSection(props: TypekitSectionProps) {
  return (
    <md.Section heading={props.typekit.memberName}>
      <ay.Prose>{props.typekit.doc && <TsDoc node={props.typekit.doc} />}</ay.Prose>
      <ay.For each={Object.values(props.typekit.entries)}>
        {(x) => <TypekitFunction typekit={x as any} />}
      </ay.For>
    </md.Section>
  );
}
