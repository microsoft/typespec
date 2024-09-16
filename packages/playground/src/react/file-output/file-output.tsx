import { Select, type SelectOnChangeData } from "@fluentui/react-components";
import { useCallback, useMemo, useState, type FunctionComponent } from "react";
import type { FileOutputViewer } from "../types.js";
import { OutputEditor } from "../typespec-editor.js";
import style from "./file-output.module.css";

export interface FileOutputProps {
  readonly filename: string;
  readonly content: string;
  readonly viewers: Record<string, FileOutputViewer>;
}

/**
 * Display a file output using different viewers.
 */
export const FileOutput: FunctionComponent<FileOutputProps> = ({ filename, content, viewers }) => {
  const resolvedViewers: Record<string, FileOutputViewer> = useMemo(
    () => ({
      [RawFileViewer.key]: RawFileViewer,
      ...viewers,
    }),
    [viewers],
  );
  const keys = Object.keys(resolvedViewers);

  const [selected, setSelected] = useState<string>(keys[0]);

  const handleSelected = useCallback((_: unknown, data: SelectOnChangeData) => {
    setSelected(data.value);
  }, []);

  const selectedRender = useMemo(() => {
    return resolvedViewers[selected].render;
  }, [selected, resolvedViewers]);

  if (keys.length === 0) {
    return <>No viewers</>;
  } else if (keys.length === 1) {
    return resolvedViewers[keys[0]].render({ filename, content });
  }

  return (
    <div className={style["file-output"]}>
      <div className={style["viewer-selector"]}>
        <Select value={selected} onChange={handleSelected} aria-label="Select viewer">
          {Object.values(resolvedViewers).map(({ key, label }) => (
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

const RawFileViewer: FileOutputViewer = {
  key: "raw",
  label: "File",
  render: ({ filename, content }) => <OutputEditor filename={filename} value={content} />,
};
