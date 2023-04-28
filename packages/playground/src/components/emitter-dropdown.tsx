import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { importShim } from "../core.js";
import { PlaygroundManifest } from "../manifest.js";
import { selectedEmitterState } from "../state.js";

export interface EmitterDropdownProps {}

export const EmitterDropdown: FunctionComponent<EmitterDropdownProps> = () => {
  const [emitters, setEmitters] = useState<string[]>([]);

  useEffect(() => {
    Promise.all(PlaygroundManifest.libraries.map(async (x) => [x, await importShim(x)]))
      .then((emitters) => {
        setEmitters(emitters.filter(([, x]) => (x as any).$lib?.emitter).map((x: any) => x[0]));
      })
      // eslint-disable-next-line no-console
      .catch((e) => console.error("Failed to load emitters", e));
  }, []);

  const options = emitters.map((emitterName) => {
    return <option key={emitterName}>{emitterName}</option>;
  });
  const [selectedEmitter, selectEmitter] = useRecoilState(selectedEmitterState);

  const handleSelected = useCallback(
    (evt: any) => {
      selectEmitter(evt.target.value);
    },
    [selectEmitter]
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
