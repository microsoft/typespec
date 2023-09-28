import {
  Input,
  InputOnChangeData,
  Label,
  Radio,
  RadioGroup,
  RadioGroupOnChangeData,
  Switch,
  SwitchOnChangeData,
  useId,
} from "@fluentui/react-components";
import { TypeSpecLibrary } from "@typespec/compiler";
import { FunctionComponent, useCallback, useMemo } from "react";
import { EmitterOptions } from "../types.js";

export interface EmitterOptionsFormProps {
  library: TypeSpecLibrary<any>;
  options: EmitterOptions;
  optionsChanged: (options: EmitterOptions) => void;
}
export const EmitterOptionsForm: FunctionComponent<EmitterOptionsFormProps> = ({
  library,
  options,
  optionsChanged,
}) => {
  const emitterOptionsSchema = library.emitter?.options?.properties;
  if (emitterOptionsSchema === undefined) {
    return <>"No options"</>;
  }
  const entries = Object.entries(emitterOptionsSchema);

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
    [options, optionsChanged]
  );
  return (
    <div>
      {entries.map(([key, value]) => {
        return (
          <div key={key} css={{ margin: "16px 0" }}>
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

type JsonSchemaProperty = {
  type: "string" | "boolean" | "number";
  description?: string;
  enum?: string[];
  default?: any;
};

type JsonSchemaPropertyInputProps = {
  emitterOptions: Record<string, unknown>;
  name: string;
  prop: JsonSchemaProperty;
  onChange: (data: { name: string; value: unknown }) => void;
};

const JsonSchemaPropertyInput: FunctionComponent<JsonSchemaPropertyInputProps> = ({
  emitterOptions,
  name,
  prop,
  onChange,
}) => {
  const prettyName = useMemo(
    () => name[0].toUpperCase() + name.slice(1).replace(/-/g, " "),
    [name]
  );
  const inputId = useId("input");
  const value = emitterOptions[name] ?? prop.default;
  const handleChange = useCallback(
    (_: unknown, data: RadioGroupOnChangeData | SwitchOnChangeData | InputOnChangeData) =>
      onChange({ name, value: "value" in data ? data.value : data.checked }),
    [onChange]
  );

  switch (prop.type) {
    case "boolean":
      return <Switch label={prettyName} checked={value} onChange={handleChange} />;
    case "string":
    default:
      return (
        <div>
          <div>
            <Label htmlFor={inputId} title={name}>
              {prettyName}
            </Label>
          </div>
          <div>
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
        </div>
      );
  }
};
