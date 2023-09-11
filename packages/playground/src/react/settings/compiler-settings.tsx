import { CompilerOptions, LinterRuleSet, TypeSpecLibrary } from "@typespec/compiler";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { EmitterOptions, PlaygroundTspLibrary } from "../types.js";
import { EmitterOptionsForm } from "./emitter-options-form.js";
import { LinterForm } from "./linter-form.js";

export type CompilerSettingsProps = {
  libraries: PlaygroundTspLibrary[];
  selectedEmitter: string;
  options: CompilerOptions;
  onOptionsChanged: (options: CompilerOptions) => void;
};

export const CompilerSettings: FunctionComponent<CompilerSettingsProps> = ({
  selectedEmitter,
  libraries,
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
  const library = useTypeSpecLibrary(selectedEmitter);
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
        libraries={libraries}
        linterRuleSet={linterRuleSet}
        onLinterRuleSetChanged={linterRuleSetChanged}
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
