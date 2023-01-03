import { CadlLibrary } from "@cadl-lang/compiler";
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
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { emittersOptionsState, selectedEmitterState } from "../state.js";

export const OutputSettings: FunctionComponent = () => {
  const [selectedEmitter] = useRecoilState(selectedEmitterState);
  const library = useCadlLibrary(selectedEmitter);
  return (
    <div css={{ padding: 10 }}>
      <h2>Settings</h2>
      <>Emitter: {selectedEmitter}</>
      <h3>Options</h3>
      {library && <EmitterOptionsForm library={library} />}
    </div>
  );
};

function useCadlLibrary(name: string): CadlLibrary<any> | undefined {
  const [lib, setLib] = useState<CadlLibrary<any>>();

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

type EmitterOptionsFormProps = {
  library: CadlLibrary<any>;
};

const EmitterOptionsForm: FunctionComponent<EmitterOptionsFormProps> = (props) => {
  const emitterOptionsSchema = props.library.emitter?.options?.properties;
  if (emitterOptionsSchema === undefined) {
    return <>"No options"</>;
  }
  const [emittersOptions, setEmittersOptions] = useRecoilState(emittersOptionsState);
  const entries = Object.entries(emitterOptionsSchema);

  const handleChange = useCallback(
    ({ name, value }: { name: string; value: unknown }) => {
      setEmittersOptions((existingOptions) => ({
        ...existingOptions,
        [props.library.name]: {
          ...existingOptions[props.library.name],
          [name]: value,
        },
      }));
    },
    [setEmittersOptions]
  );
  return (
    <div>
      {entries.map(([key, value]) => {
        return (
          <div key={key} css={{ margin: "16px 0" }}>
            <JsonSchemaPropertyInput
              emitterOptions={emittersOptions[props.library.name] ?? {}}
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
