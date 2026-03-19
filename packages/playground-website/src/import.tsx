import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Label,
} from "@fluentui/react-components";
import { ArrowUploadFilled } from "@fluentui/react-icons";
import { combineProjectIntoFile, createRemoteHost } from "@typespec/pack";
import {
  DiagnosticList,
  Editor,
  useMonacoModel,
  usePlaygroundContext,
  type CommandBarItem,
} from "@typespec/playground/react";
import { useState, type FunctionComponent, type ReactNode } from "react";
import { parse } from "yaml";
import style from "./import.module.css";

type ImportType = "openapi3" | "tsp";

/** Hook that creates a CommandBarItem for the Import action with sub-menu items. */
export function useImportCommandBarItem(): CommandBarItem {
  const [open, setOpen] = useState<ImportType>();

  return {
    id: "import",
    label: "Import",
    icon: <ArrowUploadFilled />,
    align: "right",
    children: [
      { id: "import-tsp", label: "Remote TypeSpec", onClick: () => setOpen("tsp") },
      {
        id: "import-openapi3",
        label: "From OpenAPI 3 spec",
        onClick: () => setOpen("openapi3"),
      },
    ],
    content: <ImportDialog open={open} onClose={() => setOpen(undefined)} />,
  };
}

const ImportDialog: FunctionComponent<{
  open: "openapi3" | "tsp" | undefined;
  onClose: () => void;
}> = ({ open, onClose }) => {
  return (
    <Dialog open={open !== undefined} onOpenChange={() => onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            {open === "openapi3" && <ImportOpenAPI3 onImport={onClose} />}
            {open === "tsp" && <ImportTsp onImport={onClose} />}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

const ImportOpenAPI3 = ({ onImport }: { onImport: () => void }) => {
  const [error, setError] = useState<string | null>(null);
  const model = useMonacoModel("openapi3.yaml");
  const context = usePlaygroundContext();

  const importSpec = async () => {
    const content = model.getValue();

    const openapi3 = await import("@typespec/openapi3");

    const yaml = parse(content);
    try {
      const tsp = await openapi3.convertOpenAPI3Document(yaml, { disableExternalRefs: true });
      context.setContent(tsp);
      onImport();
    } catch (e: any) {
      setError(e.toString());
    }
  };
  return (
    <div>
      <h3>Import OpenAPI3.0 document</h3>

      <div className={style["import-editor-container"]}>
        <Editor model={model} options={{ minimap: { enabled: false } }} />
      </div>
      {error && <div className={style["error"]}>{error}</div>}
      <Button appearance="primary" className="import-btn" onClick={importSpec}>
        Import
      </Button>
    </div>
  );
};

const ImportTsp = ({ onImport }: { onImport: () => void }) => {
  const [error, setError] = useState<ReactNode | null>(null);
  const [value, setValue] = useState("");
  const context = usePlaygroundContext();

  const importSpec = async () => {
    const content = value;
    const result = await combineProjectIntoFile(createRemoteHost(), content);
    if (result.diagnostics.length > 0) {
      setError(<DiagnosticList diagnostics={result.diagnostics} />);
      return;
    } else if (result.content) {
      context.setContent(result.content);
      onImport();
    }
  };
  return (
    <div>
      <h3>Import Remote Tsp Document</h3>

      <div>
        <Label>Url to import</Label>
      </div>
      <Input
        value={value}
        onChange={(_, data) => setValue(data.value)}
        className={style["url-input"]}
      />
      {error && <div className={style["error"]}>{error}</div>}
      <div>
        <Button appearance="primary" className="import-btn" onClick={importSpec}>
          Import
        </Button>
      </div>
    </div>
  );
};
