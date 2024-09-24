import {
  Input,
  Label,
  Radio,
  RadioGroup,
  Switch,
  useId,
  type InputOnChangeData,
  type RadioGroupOnChangeData,
  type SwitchOnChangeData,
} from "@fluentui/react-components";
import { useCallback, useMemo, type FunctionComponent } from "react";
import type { PlaygroundTspLibrary } from "../../types.js";
import type { EmitterOptions } from "../types.js";
import style from "./emitter-options-form.module.css";

export interface EmitterOptionsFormProps {
  readonly library: PlaygroundTspLibrary;
  readonly options: EmitterOptions;
  readonly optionsChanged: (options: EmitterOptions) => void;
}

export const EmitterOptionsForm: FunctionComponent<EmitterOptionsFormProps> = ({
  library,
  options,
  optionsChanged,
}) => {
  const handleChange = useCallback(
    ({ name, value }: { name: string; value: unknown }) => {
      optionsChanged({
        ...options,
        [library.name]: {
          ...options[library.name],
          [name]: value,
        },
      });
    },
    [library.name, options, optionsChanged],
  );

  const emitterOptionsSchema = library.definition?.emitter?.options?.properties;
  if (emitterOptionsSchema === undefined) {
    return <>"No options"</>;
  }
  const entries = Object.entries(emitterOptionsSchema);

  return (
    <div className={style["form"]}>
      {entries.map(([key, value]) => {
        return (
          <div key={key} className={style["form-item"]}>
            <JsonSchemaPropertyInput
              emitterOptions={options[library.name] ?? {}}
              name={key}
              prop={value as any}
              onChange={handleChange}
            />
          </div>
        );
      })}
    </div>
  );
};

interface JsonSchemaProperty {
  readonly type: "string" | "boolean" | "number";
  readonly description?: string;
  readonly enum?: string[];
  readonly default?: any;
}

interface JsonSchemaPropertyInputProps {
  readonly emitterOptions: Record<string, unknown>;
  readonly name: string;
  readonly prop: JsonSchemaProperty;
  readonly onChange: (data: { name: string; value: unknown }) => void;
}

const JsonSchemaPropertyInput: FunctionComponent<JsonSchemaPropertyInputProps> = ({
  emitterOptions,
  name,
  prop,
  onChange,
}) => {
  const prettyName = useMemo(
    () => name[0].toUpperCase() + name.slice(1).replace(/-/g, " "),
    [name],
  );
  const inputId = useId("input");
  const value = emitterOptions[name] ?? prop.default;
  const handleChange = useCallback(
    (_: unknown, data: RadioGroupOnChangeData | SwitchOnChangeData | InputOnChangeData) =>
      onChange({ name, value: "value" in data ? data.value : data.checked }),
    [name, onChange],
  );

  switch (prop.type) {
    case "boolean":
      return (
        <Switch
          className={style["switch"]}
          label={prettyName}
          labelPosition="above"
          checked={value}
          onChange={handleChange}
        />
      );
    case "string":
    default:
      return (
        <div className={style["item"]}>
          <Label htmlFor={inputId} title={name}>
            {prettyName}
          </Label>
          {prop.enum ? (
            <RadioGroup layout="horizontal" id={inputId} value={value} onChange={handleChange}>
              {prop.enum.map((x) => (
                <Radio key={x} value={x} label={x} />
              ))}
            </RadioGroup>
          ) : (
            <Input id={inputId} value={value} onChange={handleChange} />
          )}
        </div>
      );
  }
};
