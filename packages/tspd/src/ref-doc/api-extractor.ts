import { Extractor, ExtractorConfig, ExtractorResult } from "@microsoft/api-extractor";
import { ApiModel } from "@microsoft/api-extractor-model";
import { TSDocConfigFile } from "@microsoft/tsdoc-config";
import { joinPaths, type PackageJson } from "@typespec/compiler";

export async function createApiModel(libraryPath: string, pkgJson: PackageJson) {
  const apiModel: ApiModel = new ApiModel();

  const typekitexports = Object.keys(pkgJson.exports!).filter((x) => x.includes("typekit"));
  if (typekitexports.length === 0) {
    return undefined;
  }

  for (const exportName of [typekitexports[0]]) {
    const modelFilePath = createApiModelFileForExport(libraryPath, pkgJson, exportName);
    apiModel.loadPackage(joinPaths(modelFilePath));
  }

  return apiModel;
}

const knownConditions = ["import", "default"];

function resolveDefinitionFilePath(
  libraryPath: string,
  pkgJson: PackageJson,
  exportName: string,
): string {
  const obj = (pkgJson.exports as any)?.[exportName] as any;
  if (!obj) {
    throw new Error(`Cannot resolve definition file path for export ${exportName}`);
  }

  if (typeof obj === "string") {
    return joinPaths(libraryPath, obj).replace(/\.js$/, ".d.ts");
  }
  if (typeof obj === "object" && "types" in obj) {
    return joinPaths(libraryPath, obj.types);
  }
  for (const condition of knownConditions) {
    if (condition in obj) {
      const conditionObj = obj[condition];
      if (typeof conditionObj === "object" && "types" in conditionObj) {
        return joinPaths(libraryPath, conditionObj.types).replace(/\.js$/, ".d.ts");
      }
    }
  }
  throw new Error(`Cannot resolve definition file path for export ${exportName}`);
}

export function createApiModelFileForExport(
  libraryPath: string,
  pkgJson: PackageJson,
  exportName: string,
): string {
  const entrypoint = resolveDefinitionFilePath(libraryPath, pkgJson, exportName);
  const modelFilePath = joinPaths(libraryPath, "temp", `${exportName.slice(2)}.api.json`);
  const config = ExtractorConfig.prepare({
    configObject: {
      mainEntryPointFilePath: entrypoint,
      compiler: {
        tsconfigFilePath: joinPaths(libraryPath, "tsconfig.json"),
      },
      docModel: {
        enabled: true,
        apiJsonFilePath: modelFilePath,
      },
      projectFolder: libraryPath,
    },
    configObjectFullPath: undefined,
    tsdocConfigFile: TSDocConfigFile.loadFromObject({
      $schema: "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
      tagDefinitions: [
        {
          tagName: "@typekit",
          syntaxKind: "block",
        },
      ],
    }),
    packageJsonFullPath: joinPaths(libraryPath, "package.json"),
  });
  const extractorResult: ExtractorResult = Extractor.invoke(config);
  if (!extractorResult.succeeded) {
    throw new Error("API Extractor failed to generate the API model");
  }
  return modelFilePath;
}
