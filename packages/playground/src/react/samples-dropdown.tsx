import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback } from "react";
import { PlaygroundSample } from "../types.js";

export interface SamplesDropdownProps {
  samples: Record<string, PlaygroundSample>;
  selectedSampleName: string;
  onSelectedSampleNameChange: (sampleName: string) => void;
}

export const SamplesDropdown: FunctionComponent<SamplesDropdownProps> = ({
  samples,
  selectedSampleName,
  onSelectedSampleNameChange,
}) => {
  const options = Object.keys(samples).map((sample) => {
    return <option key={sample}>{sample}</option>;
  });

  const handleSelected = useCallback(
    (evt: any) => {
      if (samples[evt.target.value]) {
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
