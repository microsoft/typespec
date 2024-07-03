import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  ToolbarButton,
  Tooltip,
} from "@fluentui/react-components";
import { ArrowUploadFilled } from "@fluentui/react-icons";
import { Editor, useMonacoModel, usePlaygroundContext } from "@typespec/playground/react";
import { useState } from "react";
import { parse } from "yaml";
import style from "./import-openapi3.module.css";

export const ImportToolbarButton = () => {
  return (
    <Menu persistOnItemClick>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="Import" relationship="description" withArrow>
          <ToolbarButton
            appearance="subtle"
            aria-label="File Bug Report"
            icon={<ArrowUploadFilled />}
          />
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <ImportOpenAPI3MenuItem />
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
const ImportOpenAPI3MenuItem = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(event, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <MenuItem>From OpenAPI 3 spec</MenuItem>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <ImportOpenAPI3 onImport={() => setOpen(false)} />
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
      const tsp = await openapi3.convertOpenAPI3Document(yaml);
      context.setContent(tsp);
      onImport();
    } catch (e: any) {
      setError(e.toString());
    }
  };
  return (
    <div>
      <h3>Import openapi3 document</h3>

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
