import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  ToolbarButton,
} from "@fluentui/react-components";
import { Settings24Regular } from "@fluentui/react-icons";
import type { CompilerOptions } from "@typespec/compiler";
import { usePlaygroundContext } from "../context/index.js";
import { CompilerSettings } from "./compiler-settings.js";

export interface CompilerSettingsDialogButtonProps {
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  onCompilerOptionsChange: (options: CompilerOptions) => void;
}

export const CompilerSettingsDialogButton = ({
  selectedEmitter,
  compilerOptions,
  onCompilerOptionsChange,
}: CompilerSettingsDialogButtonProps) => {
  const { host } = usePlaygroundContext();

  return (
    <Dialog>
      <DialogTrigger>
        <ToolbarButton icon={<Settings24Regular />} aria-label="Open Settings" />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <CompilerSettings
              host={host}
              selectedEmitter={selectedEmitter}
              options={compilerOptions}
              onOptionsChanged={onCompilerOptionsChange}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
