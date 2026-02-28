import { Tab, TabList, type SelectTabEventHandler } from "@fluentui/react-components";
import type { CompilerOptions } from "@typespec/compiler";
import debounce from "debounce";
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";
import type { BrowserHost } from "../../types.js";
import { Editor, useMonacoModel } from "../editor.js";
import type { PlaygroundEditorsOptions } from "../playground.js";
import { CompilerSettings } from "../settings/compiler-settings.js";
import style from "./config-panel.module.css";
import { compilerOptionsToTspConfig, parseTspConfigYaml } from "./tspconfig-utils.js";

export interface ConfigPanelProps {
  host: BrowserHost;
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  onCompilerOptionsChange: (options: CompilerOptions) => void;
  onSelectedEmitterChange: (emitter: string) => void;
  editorOptions?: PlaygroundEditorsOptions;
}

type ConfigMode = "form" | "yaml";

export const ConfigPanel: FunctionComponent<ConfigPanelProps> = ({
  host,
  selectedEmitter,
  compilerOptions,
  onCompilerOptionsChange,
  onSelectedEmitterChange,
  editorOptions,
}) => {
  const [mode, setMode] = useState<ConfigMode>("form");
  const yamlModel = useMonacoModel("inmemory://test/tspconfig.yaml", "yaml");

  // Tracks whether the last state change originated from the YAML editor.
  // Persists across the render cycle so the sync-back effect can see it.
  const changeFromYamlRef = useRef(false);

  // Sync external changes (e.g. emitter dropdown) → YAML model when in yaml mode.
  // Skips when the change originated from the YAML editor itself.
  useEffect(() => {
    if (mode !== "yaml") return;
    if (changeFromYamlRef.current) {
      changeFromYamlRef.current = false;
      return;
    }
    const yaml = compilerOptionsToTspConfig(selectedEmitter, compilerOptions);
    const current = yamlModel.getValue();
    if (current !== yaml) {
      yamlModel.setValue(yaml);
    }
  }, [selectedEmitter, compilerOptions, mode, yamlModel]);

  // Debounced YAML → CompilerOptions parsing
  const parseAndSync = useMemo(
    () =>
      debounce((content: string) => {
        const parsed = parseTspConfigYaml(content);
        if (!parsed) return; // Invalid YAML — don't touch state
        changeFromYamlRef.current = true;
        if (parsed.selectedEmitter && parsed.selectedEmitter !== selectedEmitter) {
          onSelectedEmitterChange(parsed.selectedEmitter);
        }
        onCompilerOptionsChange(parsed.compilerOptions);
      }, 200),
    [selectedEmitter, onCompilerOptionsChange, onSelectedEmitterChange],
  );

  // Listen for YAML model changes
  useEffect(() => {
    const disposable = yamlModel.onDidChangeContent(() => {
      parseAndSync(yamlModel.getValue());
    });
    return () => {
      parseAndSync.clear();
      disposable.dispose();
    };
  }, [yamlModel, parseAndSync]);

  // Populate YAML model when switching to yaml mode
  const handleModeChange = useCallback<SelectTabEventHandler>(
    (_, data) => {
      const newMode = data.value as ConfigMode;
      if (newMode === "yaml") {
        const yaml = compilerOptionsToTspConfig(selectedEmitter, compilerOptions);
        yamlModel.setValue(yaml);
      }
      setMode(newMode);
    },
    [selectedEmitter, compilerOptions, yamlModel],
  );

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
