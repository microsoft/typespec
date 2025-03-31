import { AssetEmitter } from "@typespec/asset-emitter";
import { LibrarySourceFile } from "./interfaces.js";
import { CSharpServiceEmitterOptions } from "./lib.js";

export function getProjectHelpers(
  emitter: AssetEmitter<string, CSharpServiceEmitterOptions>,
  projectName: string,
  useSwaggerUI: boolean,
  httpPort: number,
  httpsPort: number,
): LibrarySourceFile[] {
  const result: LibrarySourceFile[] = [
    new LibrarySourceFile({
      filename: `${projectName}.csproj`,
      emitter: emitter,
      getContents: () => getProjectFile(useSwaggerUI),
      path: ".",
      conditional: true,
    }),
    new LibrarySourceFile({
      filename: "appsettings.json",
      emitter: emitter,
      getContents: getAppSettings,
      path: ".",
      conditional: true,
    }),
    new LibrarySourceFile({
      filename: "appsettings.Development.json",
      emitter: emitter,
      getContents: getDeveloperAppSettings,
      path: ".",
      conditional: true,
    }),
    new LibrarySourceFile({
      filename: "launchSettings.json",
      emitter: emitter,
      getContents: () => getLaunchSettings(httpPort, httpsPort),
      path: "Properties",
      conditional: true,
    }),
  ];
  return result;
}
function getProjectFile(useSwaggerUI: boolean): string {
  return `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

${
  useSwaggerUI
    ? `  <ItemGroup>
    <PackageReference Include="SwashBuckle.AspNetCore" Version="7.3.1" />
  </ItemGroup>`
    : ""
}

</Project>
`;
}
function getAppSettings(): string {
  return `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
`;
}

function getDeveloperAppSettings(): string {
  return `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
`;
}

function getLaunchSettings(httpPort: number, httpsPort: number): string {
  return `{
    "$schema": "https://json.schemastore.org/launchsettings.json",
    "profiles": {
      "https": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "applicationUrl": "https://localhost:${httpsPort};http://localhost:${httpPort}",
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      },
      "http": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "applicationUrl": "http://localhost:${httpPort}",
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      }
    }
  }`;
}
