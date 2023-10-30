import { Checkbox, CheckboxOnChangeData } from "@fluentui/react-components";
import { LinterRuleSet, RuleRef } from "@typespec/compiler";
import { FunctionComponent, useCallback } from "react";
import { PlaygroundTspLibrary } from "../types.js";

export interface LinterFormProps {
  libraries: PlaygroundTspLibrary[];
  linterRuleSet: LinterRuleSet;
  onLinterRuleSetChanged: (options: LinterRuleSet) => void;
}

export const LinterForm: FunctionComponent<LinterFormProps> = ({
  libraries,
  linterRuleSet,
  onLinterRuleSetChanged,
}) => {
  const rulesets = libraries.flatMap((lib) => {
    return Object.keys(lib.definition?.linter?.ruleSets ?? {}).map(
      (x) => `${lib.name}/${x}`
    ) as RuleRef[];
  });
  if (rulesets.length === 0) {
    return <>No ruleset available</>;
  }

  const handleChange = (ruleSet: RuleRef, checked: boolean) => {
    const ruleSets = linterRuleSet.extends ?? [];

    const updatedRuleSets = checked
      ? [...ruleSets, ruleSet]
      : ruleSets.filter((x) => x !== ruleSet);

    onLinterRuleSetChanged({
      extends: updatedRuleSets,
    });
  };
  return (
    <>
      {rulesets.map((ruleSet) => {
        return (
          <RuleSetCheckbox
            key={ruleSet}
            ruleSet={ruleSet}
            checked={linterRuleSet.extends?.includes(ruleSet)}
            onChange={handleChange}
          />
        );
      })}
    </>
  );
};

interface RuleSetCheckbox {
  ruleSet: RuleRef;
  checked?: boolean;
  onChange(ruleSet: RuleRef, checked: boolean): void;
}
const RuleSetCheckbox = ({ ruleSet, checked, onChange }: RuleSetCheckbox) => {
  const handleChange = useCallback(
    (_: any, data: CheckboxOnChangeData) => {
      onChange(ruleSet, !!data.checked);
    },
    [ruleSet, checked, onChange]
  );
  return <Checkbox label={ruleSet} checked={checked} onChange={handleChange} />;
};
