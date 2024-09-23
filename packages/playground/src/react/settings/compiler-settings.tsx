import { Divider } from "@fluentui/react-components";
import type { CompilerOptions, LinterRuleSet } from "@typespec/compiler";
import { useCallback, type FunctionComponent } from "react";
import type { BrowserHost } from "../../types.js";
import type { EmitterOptions } from "../types.js";
import { EmitterOptionsForm } from "./emitter-options-form.js";
import { LinterForm } from "./linter-form.js";

export interface CompilerSettingsProps {
  readonly host: BrowserHost;
  readonly selectedEmitter: string;
  readonly options: CompilerOptions;
  readonly onOptionsChanged: (options: CompilerOptions) => void;
}

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
    [onOptionsChanged, options],
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
    [onOptionsChanged, options],
  );
  return (
    <div>
      <>Emitter: {selectedEmitter}</>
      <Divider style={{ marginTop: 20 }} />
      <h3>Options</h3>
      {library && (
        <EmitterOptionsForm
          library={library}
          options={options.options ?? {}}
          optionsChanged={emitterOptionsChanged}
        />
      )}
      <Divider style={{ marginTop: 20 }} />
      <h3>Linter</h3>
      <LinterForm
        libraries={host.libraries}
        linterRuleSet={linterRuleSet}
        onLinterRuleSetChanged={linterRuleSetChanged}
      />
    </div>
  );
};
