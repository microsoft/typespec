import * as ay from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { TypekitApi, TypekitFunctionDoc } from "../typekit-docs.js";
import { TsDoc } from "./tsdoc.jsx";

export interface TypekitSectionProps {
  readonly typekit: TypekitApi;
}

export function TypekitSection(props: TypekitSectionProps) {
  return (
    <md.Section heading={props.typekit.typeName}>
      <ay.Prose>{props.typekit.doc && <TsDoc node={props.typekit.doc} />}</ay.Prose>
      <ay.For each={Object.values(props.typekit.entries)}>
        {(x) => <TypekitFunction typekit={x as any} />}
      </ay.For>
    </md.Section>
  );
}

export interface TypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function TypekitFunction(props: TypekitFunctionProps) {
  const path = [`$(program)`, ...props.typekit.path.slice(0, -1)];
  return (
    <md.Section heading={props.typekit.name}>
      <ay.List>
        {"```ts"}
        {props.typekit.docComment?.emitAsTsdoc().trimEnd()}
        {`${path.join(".")}.${props.typekit.excerpt.text}`}
        {"```"}
      </ay.List>
    </md.Section>
  );
}
