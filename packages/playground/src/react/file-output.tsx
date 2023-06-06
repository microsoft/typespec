import { css } from "@emotion/react";
import { FunctionComponent,  useCallback, useMemo, useState } from "react";
import { FileOutputViewer } from "./types.js";


export interface FileOutputProps {
  filename: string;
  content: string;
  viewers: FileOutputViewer[];
}

/**
 * Display a file output using different viewers.
 */
export const FileOutput: FunctionComponent<FileOutputProps> = ({
  filename,
  content,
  viewers,
}) => {
  if (viewers.length === 0) {
    return <>No viewers</>;
  } else if (viewers.length === 1) {
    return viewers[0].render({ filename, content });
  }

  const [selected, setSelected] = useState<string>(viewers[0].key);

  const handleSelected = useCallback(
    (event: any) => {
      setSelected(event.target.value);
    },
    [selected]
  );

  const selectedRender = useMemo(() => {
    return viewers.find((x) => x.key === selected)?.render;
  }, [selected, viewers]);
  return (
    <div css={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <select css={DropdownStyle} onChange={handleSelected} value={selected}>
        {viewers.map(({ key, label }) => {
          return (
            <option key={key} value={key}>
              {label}
            </option>
          );
        })}
      </select>
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
