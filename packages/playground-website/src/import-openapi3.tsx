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
  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <MenuItem>From OpenAPI 3 spec</MenuItem>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <ImportOpenAPI3 />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

const ImportOpenAPI3 = () => {
  const model = useMonacoModel("openapi3.yaml");
  const context = usePlaygroundContext();

  const importSpec = async () => {
    const content = model.getValue();

    console.log("will import", content);
    const openapi3 = await import("@typespec/openapi3");

    const yaml = parse(content);
    const tsp = await openapi3.convertOpenAPI3Document(yaml);
    console.log("Tsp", tsp);
    context.setContent(tsp);
  };
  return (
    <div>
      <h3>Import openapi3 document</h3>

      <div className={style["import-editor-container"]}>
        <Editor model={model} options={{}} />
      </div>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" className="import-btn" onClick={importSpec}>
          Import
        </Button>
      </DialogTrigger>
    </div>
  );
};
