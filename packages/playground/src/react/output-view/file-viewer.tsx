import { FolderListRegular } from "@fluentui/react-icons";
import { Pane, SplitPane } from "@typespec/react-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileBreadcrumb } from "../breadcrumb/index.js";
import { FileOutput } from "../file-output/file-output.js";
import { FileTreeExplorer } from "../file-tree/index.js";
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

  const showFileTree = useMemo(
    () => outputFiles.some((f) => f.includes("/")) || outputFiles.length >= 3,
    [outputFiles],
  );

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

  const handleFileSelection = useCallback(
    (newFilename: string) => {
      // Only select files, not directories
      if (outputFiles.includes(newFilename)) {
        setFilename(newFilename);
        void loadOutputFile(newFilename);
      }
    },
    [loadOutputFile, outputFiles],
  );

  if (outputFiles.length === 0) {
    return <>No files emitted.</>;
  }

  if (showFileTree) {
    return (
      <div className={style["file-viewer"]}>
        <SplitPane initialSizes={["220px", undefined]}>
          <Pane minSize={120} maxSize={400}>
            <FileTreeExplorer
              files={outputFiles}
              selected={filename}
              onSelect={handleFileSelection}
            />
          </Pane>
          <Pane>
            <div className={style["file-viewer-content-with-breadcrumb"]}>
              <FileBreadcrumb path={filename} />
              <div className={style["file-viewer-content"]}>
                <FileOutput filename={filename} content={content} viewers={fileViewers} />
              </div>
            </div>
          </Pane>
        </SplitPane>
      </div>
    );
  }

  return (
    <div className={style["file-viewer"]}>
      <OutputTabs filenames={outputFiles} selected={filename} onSelect={handleFileSelection} />
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
