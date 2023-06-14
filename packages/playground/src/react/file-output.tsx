import { css } from "@emotion/react";
import { Select, SelectOnChangeData } from "@fluentui/react-components";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { FileOutputViewer } from "./types.js";

export interface FileOutputProps {
  filename: string;
  content: string;
  viewers: FileOutputViewer[];
}

/**
 * Display a file output using different viewers.
 */
export const FileOutput: FunctionComponent<FileOutputProps> = ({ filename, content, viewers }) => {
  if (viewers.length === 0) {
    return <>No viewers</>;
  } else if (viewers.length === 1) {
    return viewers[0].render({ filename, content });
  }

  const [selected, setSelected] = useState<string>(viewers[0].key);

  const handleSelected = useCallback(
    (_: unknown, data: SelectOnChangeData) => {
      setSelected(data.value);
    },
    [selected]
  );

  const selectedRender = useMemo(() => {
    return viewers.find((x) => x.key === selected)?.render;
  }, [selected, viewers]);
  return (
    <div css={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Select value={selected} onChange={handleSelected} css={DropdownStyle}>
        {viewers.map(({ key, label }) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>

      {selectedRender && selectedRender({ filename, content })}
    </div>
  );
};

const DropdownStyle = css({
  margin: "0.5rem 1.5rem",
  position: "absolute",
  "z-index": 1,
  right: 0,
});
