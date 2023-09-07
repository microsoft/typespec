import { TypeSpecLibrary } from "@typespec/compiler";
import { FunctionComponent, useEffect, useState } from "react";
import { EmitterOptions, PlaygroundTspLibrary } from "../types.js";
import { EmitterOptionsForm } from "./emitter-options-form.js";
import { LinterForm } from "./linter-form.js";

export type CompilerSettingsProps = {
  libraries: PlaygroundTspLibrary[];
  selectedEmitter: string;
  options: EmitterOptions;
  optionsChanged: (options: EmitterOptions) => void;
  // linterRuleSet: LinterRuleSet;
  // linterRuleSetChanged: (options: LinterRuleSet) => void;
};

export const CompilerSettings: FunctionComponent<CompilerSettingsProps> = ({
  selectedEmitter,
  libraries,
  options,
  optionsChanged,
}) => {
  const library = useTypeSpecLibrary(selectedEmitter);
  const linterRuleSet = {};
  const linterRuleSetChanged = () => {};
  return (
    <div css={{ padding: 10 }}>
      <h2>Settings</h2>
      <>Emitter: {selectedEmitter}</>
      <h3>Options</h3>
      {library && (
        <EmitterOptionsForm library={library} options={options} optionsChanged={optionsChanged} />
      )}
      <h3>Linter</h3>
      <LinterForm
        libraries={libraries}
        linterRuleSet={linterRuleSet}
        linterRuleSetChanged={linterRuleSetChanged}
      />
    </div>
  );
};

function useTypeSpecLibrary(name: string): TypeSpecLibrary<any> | undefined {
  const [lib, setLib] = useState<TypeSpecLibrary<any>>();

  useEffect(() => {
    setLib(undefined);
    import(/* @vite-ignore */ name)
      .then((module) => {
        if (module.$lib === undefined) {
          // eslint-disable-next-line no-console
          console.error(`Couldn't load library ${name} missing $lib export`);
        }
        setLib(module.$lib);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load library", name);
      });
  }, [name]);
  return lib;
}
