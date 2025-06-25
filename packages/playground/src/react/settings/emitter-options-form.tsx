import {
  Checkbox,
  Input,
  Label,
  Radio,
  RadioGroup,
  Switch,
  useId,
  type CheckboxOnChangeData,
  type InputOnChangeData,
  type RadioGroupOnChangeData,
  type SwitchOnChangeData,
} from "@fluentui/react-components";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
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
            {(value as any).type === "array" ? (
              <JsonSchemaArrayPropertyInput
                emitterOptions={options[library.name] ?? {}}
                name={key}
                prop={value as any}
                onChange={handleChange}
              />
            ) : (
              <JsonSchemaPropertyInput
                emitterOptions={options[library.name] ?? {}}
                name={key}
                prop={value as any}
                onChange={handleChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

type JsonSchemaProperty = JsonSchemaScalarProperty;

interface JsonSchemaScalarProperty {
  readonly type: "string" | "boolean" | "number";
  readonly description?: string;
  readonly enum?: string[];
  readonly default?: any;
}

interface JsonSchemaArrayProperty {
  readonly type: "array";
  readonly description?: string;
  readonly items: JsonSchemaScalarProperty;
}

type JsonSchemaArrayPropertyInputProps = Omit<JsonSchemaPropertyInputProps, "prop"> & {
  readonly prop: JsonSchemaArrayProperty;
};

const JsonSchemaArrayPropertyInput: FunctionComponent<JsonSchemaArrayPropertyInputProps> = ({
  emitterOptions,
  name,
  prop,
  onChange,
}) => {
  const itemsSchema = prop.items;
  const value = emitterOptions[name] ?? itemsSchema.default;
  const prettyName = useMemo(
    () => name[0].toUpperCase() + name.slice(1).replace(/-/g, " "),
    [name],
  );
  const inputId = useId("input");
  const [selectedValues, setSelectedValues] = useState(new Set(value));

  const handleChange = useCallback(
    (
      _: unknown,
      data: RadioGroupOnChangeData | SwitchOnChangeData | InputOnChangeData | CheckboxOnChangeData,
      value?: string,
    ) => {
      const modifiedSelectedValues = new Set(selectedValues);
      if ("checked" in data) {
        data.checked ? modifiedSelectedValues.add(value) : modifiedSelectedValues.delete(value);
      } else {
        modifiedSelectedValues.clear();
        modifiedSelectedValues.add(data.value);
      }
      setSelectedValues(modifiedSelectedValues);
      onChange({ name, value: Array.from(modifiedSelectedValues) });
    },
    [name, onChange, selectedValues],
  );

  // Currently only have example of what `enum`-based arrays look like,
  // so just handle a single element for other arrays for now.
  if (!itemsSchema.enum) {
    return JsonSchemaPropertyInput({ emitterOptions, name, prop: itemsSchema, onChange });
  }

  const itemsEnum = itemsSchema.enum;
  return (
    <div className={style["item"]}>
      <Label htmlFor={inputId} title={name}>
        {prettyName}
      </Label>
      {itemsEnum.map((x) => (
        <Checkbox
          key={x}
          value={x}
          label={x}
          checked={selectedValues.has(x)}
          onChange={(...args) => handleChange(...args, x)}
        />
      ))}
    </div>
  );
};

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
