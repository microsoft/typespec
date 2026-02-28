import { Label, Select, Subtitle2, Text } from "@fluentui/react-components";
import type { CompilerOptions, LinterRuleSet } from "@typespec/compiler";
import { useCallback, useMemo, type FunctionComponent } from "react";
import type { BrowserHost } from "../../types.js";
import type { EmitterOptions } from "../types.js";
import style from "./compiler-settings.module.css";
import { EmitterOptionsForm } from "./emitter-options-form.js";
import { LinterForm } from "./linter-form.js";

export interface CompilerSettingsProps {
  readonly host: BrowserHost;
  readonly selectedEmitter: string;
  readonly onSelectedEmitterChange: (emitter: string) => void;
  readonly options: CompilerOptions;
  readonly onOptionsChanged: (options: CompilerOptions) => void;
}

export const CompilerSettings: FunctionComponent<CompilerSettingsProps> = ({
  selectedEmitter,
  onSelectedEmitterChange,
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

  const emitters = useMemo(
    () =>
      Object.values(host.libraries)
        .filter((x) => x.isEmitter)
        .map((x) => x.name),
    [host.libraries],
  );

  const handleEmitterChange = useCallback(
    (evt: any) => {
      onSelectedEmitterChange(evt.target.value);
    },
    [onSelectedEmitterChange],
  );

  return (
    <div className={style["settings"]}>
      <section className={style["section"]}>
        <Subtitle2 className={style["section-title"]}>Emitter</Subtitle2>
        <div className={style["field"]}>
          <Label>Select emitter</Label>
          <Select
            value={selectedEmitter}
            onChange={handleEmitterChange}
            aria-label="Select emitter"
          >
            <option value="" disabled>
              Select emitter...
            </option>
            {emitters.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
        </div>
      </section>
      <section className={style["section"]}>
        <Subtitle2 className={style["section-title"]}>Emitter options</Subtitle2>
        {library ? (
          <EmitterOptionsForm
            library={library}
            options={options.options ?? {}}
            optionsChanged={emitterOptionsChanged}
          />
        ) : (
          <Text size={200} className={style["empty"]}>
            No emitter selected
          </Text>
        )}
      </section>
      <section className={style["section"]}>
        <Subtitle2 className={style["section-title"]}>Linter rules</Subtitle2>
        <LinterForm
          libraries={host.libraries}
          linterRuleSet={linterRuleSet}
          onLinterRuleSetChanged={linterRuleSetChanged}
        />
      </section>
    </div>
  );
};
