import vscode from "vscode";

export interface EmitPackageQuickPickItem extends vscode.QuickPickItem {
  language: string;
  package: string;
  version?: string;
  fromConfig: boolean;
}

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
    package: "@typespec/http-client-csharp",
    label: "emit C# code",
    description: "from @typespec/http-client-csharp",
    fromConfig: false,
  },
];
