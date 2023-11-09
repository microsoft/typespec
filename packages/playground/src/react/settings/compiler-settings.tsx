import { CompilerOptions, LinterRuleSet } from "@typespec/compiler";
import { FunctionComponent, useCallback } from "react";
import { BrowserHost } from "../../types.js";
import { EmitterOptions } from "../types.js";
import { EmitterOptionsForm } from "./emitter-options-form.js";
import { LinterForm } from "./linter-form.js";

export type CompilerSettingsProps = {
  host: BrowserHost;
  selectedEmitter: string;
  options: CompilerOptions;
  onOptionsChanged: (options: CompilerOptions) => void;
};

export const CompilerSettings: FunctionComponent<CompilerSettingsProps> = ({
  selectedEmitter,
  host,
  options,
  onOptionsChanged,
}) => {
  const emitterOptionsChanged = useCallback(
    (emitterOptions: EmitterOptions) => {
      onOptionsChanged({
        ...options,
        options: emitterOptions,
      });
    },
    [options]
  );
  const library = host.libraries[selectedEmitter];
  const linterRuleSet = options.linterRuleSet ?? {};
  const linterRuleSetChanged = useCallback(
    (linterRuleSet: LinterRuleSet) => {
      onOptionsChanged({
        ...options,
        linterRuleSet,
      });
    },
    [options]
  );
  return (
    <div css={{ padding: 10 }}>
      <h2>Settings</h2>
      <>Emitter: {selectedEmitter}</>
      <h3>Options</h3>
      {library && (
        <EmitterOptionsForm
          library={library}
          options={options.options ?? {}}
          optionsChanged={emitterOptionsChanged}
        />
      )}
      <h3>Linter</h3>
      <LinterForm
        libraries={host.libraries}
        linterRuleSet={linterRuleSet}
        onLinterRuleSetChanged={linterRuleSetChanged}
      />
    </div>
  );
};
