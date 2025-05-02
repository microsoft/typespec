import { Extractor, ExtractorConfig, ExtractorResult } from "@microsoft/api-extractor";
import { ApiModel } from "@microsoft/api-extractor-model";
import { TSDocConfigFile } from "@microsoft/tsdoc-config";
import { joinPaths, type PackageJson } from "@typespec/compiler";

export async function createApiModel(libraryPath: string, pkgJson: PackageJson) {
  return createApiModelForExport(libraryPath, pkgJson, Object.keys(pkgJson.exports!)[0]);
}

export function createApiModelForExport(
  libraryPath: string,
  pkgJson: PackageJson,
  exportName: string,
) {
  const modelFilePath = joinPaths(libraryPath, "temp", `${exportName}.api.json`);
  const config = ExtractorConfig.prepare({
    configObject: {
      mainEntryPointFilePath: joinPaths(libraryPath, "dist/src/experimental/typekit/index.d.ts"),
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
          syntaxKind: "modifier",
        },
      ],
    }),
    packageJsonFullPath: joinPaths(libraryPath, "package.json"),
  });
  const extractorResult: ExtractorResult = Extractor.invoke(config);
  if (!extractorResult.succeeded) {
    throw new Error("API Extractor failed to generate the API model");
  }
  const apiModel: ApiModel = new ApiModel();
  apiModel.loadPackage(joinPaths(modelFilePath));
  return apiModel;
}
