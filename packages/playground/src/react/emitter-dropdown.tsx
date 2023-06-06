import { Select } from "@fluentui/react-components";
import { FunctionComponent, useCallback } from "react";

export type EmitterDropdownProps = {
  emitters: string[];
  selectedEmitter: string;
  onSelectedEmitterChange: (emitter: string) => void;
};

export const EmitterDropdown: FunctionComponent<EmitterDropdownProps> = ({
  emitters,
  onSelectedEmitterChange,
  selectedEmitter,
}) => {
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
