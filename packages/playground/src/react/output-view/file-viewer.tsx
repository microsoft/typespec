import { FolderListRegular } from "@fluentui/react-icons";
import { Pane, SplitPane } from "@typespec/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileBreadcrumb } from "../breadcrumb/index.js";
import { FileOutput } from "../file-output/file-output.js";
import { FileTreeExplorer } from "../file-tree/index.js";
import { OutputTabs } from "../output-tabs/output-tabs.js";
import type { FileOutputViewer, OutputViewerProps, ProgramViewer } from "../types.js";
import { useFileChanges } from "./use-file-changes.js";

import style from "./output-view.module.css";

const FileViewerComponent = ({
  program,
  outputFiles,
  fileViewers,
}: OutputViewerProps & {
  fileViewers: Record<string, FileOutputViewer>;
}) => {
  const [filename, setFilename] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const { changedFiles, changedLines } = useFileChanges(program, outputFiles);

  const showFileTree = useMemo(
    () =>
      outputFiles.length > 1 &&
      (outputFiles.some((f) => f.includes("/")) || outputFiles.length >= 3),
    [outputFiles],
  );

  const lastContentsRef = useRef(new Map<string, string>());

  const loadOutputFile = useCallback(
    async (path: string) => {
      try {
        const contents = await program.host.readFile("./tsp-output/" + path);
        lastContentsRef.current.set(path, contents.text);
        setContent(contents.text);
      } catch {
        // Failed compilations keep the previous file list after tsp-output was emptied.
        setContent(lastContentsRef.current.get(path) ?? "");
      }
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
              changedFiles={changedFiles}
            />
          </Pane>
          <Pane>
            <div className={style["file-viewer-content-with-breadcrumb"]}>
              <FileBreadcrumb path={filename} />
              <div className={style["file-viewer-content"]}>
                <FileOutput
                  filename={filename}
                  content={content}
                  viewers={fileViewers}
                  changedLineNumbers={changedLines.get(filename)}
                />
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
        <FileOutput
          filename={filename}
          content={content}
          viewers={fileViewers}
          changedLineNumbers={changedLines.get(filename)}
        />
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
