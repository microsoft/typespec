import vscode from "vscode";
import { languageEmitterSettingNames } from "../const.js";
import { EmitQuickPickItem } from "./emit-quick-pick-item.js";

const extensionConfig = vscode.workspace.getConfiguration();

function getEmitterPickItem(language: string): EmitQuickPickItem {
  const packageName: string =
    extensionConfig.get(languageEmitterSettingNames[language] ?? "") ?? "";
  return {
    language: language,
    package: packageName,
    label: `Generate ${language} client sdk`,
    description: `from emitter ${packageName}`,
    fromConfig: false,
  };
}

export const recommendedEmitters: ReadonlyArray<EmitQuickPickItem> = Object.keys(
  languageEmitterSettingNames,
).map((lang) => getEmitterPickItem(lang));

/*
export const recommendedEmitters: ReadonlyArray<EmitPackageQuickPickItem> = [
  {
    language: "openapi3",
    package: "@typespec/openapi3",
    label: "emit OpenAPI 3.0",
    description: "from @typespec/openapi3",
    fromConfig: false,
  },
  {
    language: "json-schema",
    package: "@typespec/json-schema",
    label: "emit JSON Schema",
    description: "from @typespec/json-schema",
    fromConfig: false,
  },
  {
    language: "protobuf",
    package: "@typespec/protobuf",
    label: "emit Protobuf",
    description: "from @typespec/protobuf",
    fromConfig: false,
  },
  {
    language: "Net",
    package: config.get("typespec.emitter.net") ?? "@typespec/http-client-csharp",
    label: "emit C# code",
    description: "from @typespec/http-client-csharp",
    fromConfig: false,
  },
];
*/
