import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback } from "react";
import { PlaygroundManifest } from "../manifest.js";

export interface SamplesDropdownProps {
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export const SamplesDropdown: FunctionComponent<SamplesDropdownProps> = ({
  selectedSampleName,
  onSelectedSampleNameChange,
}) => {
  const options = Object.keys(PlaygroundManifest.samples).map((sample) => {
    return <option key={sample}>{sample}</option>;
  });

  const handleSelected = useCallback(
    (evt: any) => {
      if (PlaygroundManifest.samples[evt.target.value]) {
        onSelectedSampleNameChange(evt.target.value);
      }
    },
    [onSelectedSampleNameChange]
  );
  return (
    <Select className="sample-dropdown" onChange={handleSelected} value={selectedSampleName ?? ""}>
      <option value="" disabled>
        Select sample...
      </option>
      {options}
    </Select>
  );
};
