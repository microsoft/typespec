import * as ay from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { TypekitApi, TypekitFunctionDoc } from "../typekit-docs.js";
import { DiagnosableTypekitFunction } from "./diagnosable-typekit-function.jsx";
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
  if (props.typekit.kind === "diagnosable") {
    return <DiagnosableTypekitFunction typekit={props.typekit} />;
  }
  const path = [`$(program)`, ...props.typekit.path.slice(0, -1)];
  const sig = props.typekit.kind === "getter" ? props.typekit.name : props.typekit.excerpt.text;
  return (
    <md.Section heading={props.typekit.path.join(".")}>
      <ay.List>
        {"```ts"}
        {props.typekit.docComment?.emitAsTsdoc().trimEnd()}
        {`${path.join(".")}.${sig}`}
        {"```"}
      </ay.List>
    </md.Section>
  );
}
