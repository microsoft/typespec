import { Tab, TabList, type SelectTabEventHandler } from "@fluentui/react-components";
import type { CompilerOptions } from "@typespec/compiler";
import debounce from "debounce";
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import type { BrowserHost } from "../../types.js";
import { Editor, useMonacoModel } from "../editor.js";
import type { PlaygroundEditorsOptions } from "../playground.js";
import { CompilerSettings } from "../settings/compiler-settings.js";
import style from "./config-panel.module.css";

export interface ConfigPanelProps {
  host: BrowserHost;
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  /** Raw tspconfig.yaml content (source of truth). */
  tspconfig: string;
  onCompilerOptionsChange: (options: CompilerOptions) => void;
  onSelectedEmitterChange: (emitter: string) => void;
  onTspconfigChange: (tspconfig: string) => void;
  editorOptions?: PlaygroundEditorsOptions;
}

type ConfigMode = "form" | "yaml";

export const ConfigPanel: FunctionComponent<ConfigPanelProps> = ({
  host,
  selectedEmitter,
  compilerOptions,
  tspconfig,
  onCompilerOptionsChange,
  onSelectedEmitterChange,
  onTspconfigChange,
  editorOptions,
}) => {
  const [mode, setMode] = useState<ConfigMode>("form");
  const yamlModel = useMonacoModel("inmemory://test/tspconfig.yaml", "yaml");

  // Tracks whether the last model change originated from the YAML editor itself so the
  // state → model sync effect doesn't clobber in-flight edits (state updates are debounced).
  const changeFromYamlRef = useRef(false);

  // Debounced YAML → state propagation. The raw text is the source of truth so it is
  // stored verbatim (comments, ordering and unknown fields are all preserved).
  const propagateChange = useMemo(
    () =>
      debounce((content: string) => {
        onTspconfigChange(content);
      }, 200),
    [onTspconfigChange],
  );

  // Listen for YAML model changes
  useEffect(() => {
    const disposable = yamlModel.onDidChangeContent(() => {
      changeFromYamlRef.current = true;
      propagateChange(yamlModel.getValue());
    });
    return () => {
      propagateChange.clear();
      disposable.dispose();
    };
  }, [yamlModel, propagateChange]);

  // Sync state → YAML model (initial load, visual-form edits, samples, external changes).
  // Skips when the change originated from the YAML editor to avoid reverting live edits.
  useEffect(() => {
    if (changeFromYamlRef.current) {
      changeFromYamlRef.current = false;
      return;
    }
    if (yamlModel.getValue() !== tspconfig) {
      yamlModel.setValue(tspconfig);
    }
  }, [tspconfig, yamlModel]);

  const handleModeChange = useCallback<SelectTabEventHandler>((_, data) => {
    setMode(data.value as ConfigMode);
  }, []);

  return (
    <div className={style["config-panel"]}>
      <div className={style["config-toggle"]}>
        <TabList size="small" selectedValue={mode} onTabSelect={handleModeChange}>
          <Tab value="form">Visual</Tab>
          <Tab value="yaml">Yaml</Tab>
        </TabList>
      </div>
      <div className={style["config-content"]}>
        {mode === "form" ? (
          <div className={style["form-content"]}>
            <CompilerSettings
              host={host}
              selectedEmitter={selectedEmitter}
              onSelectedEmitterChange={onSelectedEmitterChange}
              options={compilerOptions}
              onOptionsChanged={onCompilerOptionsChange}
            />
          </div>
        ) : (
          <Editor model={yamlModel} options={{ ...editorOptions, minimap: { enabled: false } }} />
        )}
      </div>
    </div>
  );
};
