import { FunctionComponent, useCallback, useState } from "react";
import { samples } from "../samples";

export interface SamplesDropdownProps {
  onSelectSample: (content: string) => void;
}
export const SamplesDropdown: FunctionComponent<SamplesDropdownProps> = ({ onSelectSample }) => {
  const [selected, setSelected] = useState<string>("");
  const options = Object.keys(samples).map((sample) => {
    return <option key={sample}>{sample}</option>;
  });

  const handleSelected = useCallback(
    (evt: any) => {
      setSelected(evt.target.value);
      onSelectSample(samples[evt.target.value]);
    },
    [onSelectSample]
  );
  return (
    <select onChange={handleSelected} value={selected}>
      <option value="" disabled>
        Select sample...
      </option>
      {options}
    </select>
  );
};
