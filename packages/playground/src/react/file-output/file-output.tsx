import { Select, SelectOnChangeData } from "@fluentui/react-components";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { FileOutputViewer } from "../types.js";
import style from "./file-output.module.css";

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
    <div className={style["file-output"]}>
      <div className={style["viewer-selector"]}>
        <Select value={selected} onChange={handleSelected}>
          {viewers.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {selectedRender && selectedRender({ filename, content })}
    </div>
  );
};
