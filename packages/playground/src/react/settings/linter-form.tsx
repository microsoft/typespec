import { LinterRuleSet } from "@typespec/compiler";
import { FunctionComponent } from "react";
import { PlaygroundTspLibrary } from "../types.js";
import { Checkbox } from "@fluentui/react-components";

export interface LinterFormProps {
  libraries: PlaygroundTspLibrary[];
  linterRuleSet: LinterRuleSet;
  linterRuleSetChanged: (options: LinterRuleSet) => void;
}

export const LinterForm: FunctionComponent<LinterFormProps> = ({ libraries }) => {
  const rulesets = libraries.flatMap((lib) => {
    return Object.keys(lib.definition?.linter?.ruleSets ?? {});
  });
  if (rulesets.length === 0) {
    return <>No ruleset available</>;
  }
  return (
    <>
      {rulesets.map((ruleSet) => {
        return <Checkbox label={ruleSet} />;
      })}
    </>
  );
};
