import { FolderListRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";
import { FileOutput } from "../file-output/file-output.js";
import { OutputTabs } from "../output-tabs/output-tabs.js";
import type { OutputViewerProps, ProgramViewer } from "../types.js";

import style from "./output-view.module.css";

const FileViewerComponent = ({ program, outputFiles }: OutputViewerProps) => {
  const [filename, setFilename] = useState<string>("");
  const [content, setContent] = useState<string>("");
  if (outputFiles.length === 0) {
    return <>No files emitted.</>;
  }

  useEffect(() => {
    if (outputFiles.length > 0) {
      const fileStillThere = outputFiles.find((x) => x === filename);
      const newFilename = fileStillThere ?? outputFiles[0];
      setFilename(newFilename);
      void loadOutputFile(fileStillThere ?? outputFiles[0]);
    } else {
      setFilename("");
    }
  }, [program, outputFiles]);

  async function loadOutputFile(path: string) {
    const contents = await program.host.readFile("./tsp-output/" + path);
    setContent(contents.text);
  }

  const handleTabSelection = useCallback(
    (newFilename: string) => {
      setFilename(newFilename);
      void loadOutputFile(newFilename);
    },
    [setFilename]
  );

  return (
    <div className={style["file-viewer"]}>
      <OutputTabs filenames={outputFiles} selected={filename} onSelect={handleTabSelection} />
      <div className={style["file-viewer-content"]}>
        <FileOutput filename={filename} content={content} viewers={[] as any} />
      </div>
    </div>
  );
};

export const FileViewer: ProgramViewer = {
  key: "file-output",
  label: "Output explorer",
  icon: <FolderListRegular />,
  render: FileViewerComponent,
};
