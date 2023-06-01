import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback } from "react";
import { useRecoilState } from "recoil";
import { PlaygroundManifest } from "../manifest.js";
import { selectedSampleState } from "../state.js";
export interface SamplesDropdownProps {}
export const SamplesDropdown: FunctionComponent<SamplesDropdownProps> = () => {
  const [selected, setSelected] = useRecoilState(selectedSampleState);

  const options = Object.keys(PlaygroundManifest.samples).map((sample) => {
    return <option key={sample}>{sample}</option>;
  });

  const handleSelected = useCallback(
    (evt: any) => {
      if (PlaygroundManifest.samples[evt.target.value]) {
        setSelected(evt.target.value);
      }
    },
    [setSelected]
  );
  return (
    <Select className="sample-dropdown" onChange={handleSelected} value={selected ?? ""}>
      <option value="" disabled>
        Select sample...
      </option>
      {options}
    </Select>
  );
};
