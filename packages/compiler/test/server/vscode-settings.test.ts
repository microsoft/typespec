import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getVsCodeSettings, updateVsCodeSettings } from "../../src/server/vscode-settings.js";

describe("compiler: server: vscode-settings", () => {
  it("gets default empty settings when not initialized", () => {
    // Reset global settings to default state
    updateVsCodeSettings({});

    const settings = getVsCodeSettings();

    // Check default empty settings
    deepStrictEqual(settings.vscodeSettings, {});
    strictEqual(settings.getSetting("anything"), undefined);
  });

  it("updates vscode settings correctly", () => {
    // Start with empty settings
    updateVsCodeSettings({});

    // Then update them
    const newSettings = {
      updatedSetting: "newValue",
      anotherSetting: true,
      nestedSetting: { key: "value" },
    };

    updateVsCodeSettings(newSettings);

    // Check settings were updated
    const settings = getVsCodeSettings();
    strictEqual(settings.vscodeSettings.updatedSetting, "newValue");
    strictEqual(settings.vscodeSettings.anotherSetting, true);
    deepStrictEqual(settings.vscodeSettings.nestedSetting, { key: "value" });
    strictEqual(settings.getSetting("updatedSetting"), undefined);
    deepStrictEqual(settings.getSetting("nestedSetting"), undefined);
  });

  it("handles case of updating with null or undefined", () => {
    // Initialize with some settings
    updateVsCodeSettings({ existing: "value" });

    // Update with undefined should result in empty object
    updateVsCodeSettings(undefined as any);

    let settings = getVsCodeSettings();
    deepStrictEqual(settings.vscodeSettings, {});

    // Update with null should result in empty object
    updateVsCodeSettings(null as any);

    settings = getVsCodeSettings();
    deepStrictEqual(settings.vscodeSettings, {});
  });
});
