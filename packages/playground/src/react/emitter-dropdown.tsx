import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { importLibrary } from "../core.js";
import { PlaygroundManifest } from "../manifest.js";

export interface EmitterDropdownProps {
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;
}

export const EmitterDropdown: FunctionComponent<EmitterDropdownProps> = ({
  onSelectedEmitterChange,
  selectedEmitter,
}) => {
  const [emitters, setEmitters] = useState<string[]>([]);

  useEffect(() => {
    Promise.all(PlaygroundManifest.libraries.map(async (x) => [x, await importLibrary(x)]))
      .then((emitters) => {
        setEmitters(emitters.filter(([, x]) => (x as any).$lib?.emitter).map((x: any) => x[0]));
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error("Failed to load emitters", e));
  }, []);

  const options = emitters.map((emitterName) => {
    return <option key={emitterName}>{emitterName}</option>;
  });

  const handleSelected = useCallback(
    (evt: any) => {
      onSelectedEmitterChange(evt.target.value);
    },
    [onSelectedEmitterChange]
  );
  return (
    <Select className="sample-dropdown" onChange={handleSelected} value={selectedEmitter}>
      <option value="" disabled>
        Select emitter...
      </option>
      {options}
    </Select>
  );
};
