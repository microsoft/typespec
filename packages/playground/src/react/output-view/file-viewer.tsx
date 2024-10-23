import { FolderListRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";
import { FileOutput } from "../file-output/file-output.js";
import { OutputTabs } from "../output-tabs/output-tabs.js";
import type { FileOutputViewer, OutputViewerProps, ProgramViewer } from "../types.js";

import style from "./output-view.module.css";

const FileViewerComponent = ({
  program,
  outputFiles,
  fileViewers,
}: OutputViewerProps & { fileViewers: Record<string, FileOutputViewer> }) => {
  const [filename, setFilename] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const loadOutputFile = useCallback(
    async (path: string) => {
      const contents = await program.host.readFile("./tsp-output/" + path);
      setContent(contents.text);
    },
    [program.host],
  );

  useEffect(() => {
    if (outputFiles.length > 0) {
      const fileStillThere = outputFiles.find((x) => x === filename);
      const newFilename = fileStillThere ?? outputFiles[0];
      setFilename(newFilename);
      void loadOutputFile(fileStillThere ?? outputFiles[0]);
    } else {
      setFilename("");
    }
  }, [program, outputFiles, loadOutputFile, filename]);

  const handleTabSelection = useCallback(
    (newFilename: string) => {
      setFilename(newFilename);
      void loadOutputFile(newFilename);
    },
    [loadOutputFile],
  );

  if (outputFiles.length === 0) {
    return <>No files emitted.</>;
  }

  return (
    <div className={style["file-viewer"]}>
      <OutputTabs filenames={outputFiles} selected={filename} onSelect={handleTabSelection} />
      <div className={style["file-viewer-content"]}>
        <FileOutput filename={filename} content={content} viewers={fileViewers} />
      </div>
    </div>
  );
};

export function createFileViewer(fileViewers: FileOutputViewer[]): ProgramViewer {
  const viewerMap = Object.fromEntries(fileViewers.map((x) => [x.key, x]));
  return {
    key: "file-output",
    label: "Output explorer",
    icon: <FolderListRegular />,
    render: (props) => {
      return <FileViewerComponent {...props} fileViewers={viewerMap} />;
    },
  };
}
