import { SourceDirectory, SourceFile, type Children } from "@alloy-js/core";

export interface LaunchSettingsProps {
  /** The HTTP port for local hosting. */
  httpPort: number;
  /** The HTTPS port for local hosting. */
  httpsPort: number;
}

/**
 * Renders launchSettings.json and appsettings files for the ASP.NET project.
 */
export function LaunchSettings(props: LaunchSettingsProps): Children {
  const launchSettings = JSON.stringify(
    {
      $schema: "https://json.schemastore.org/launchsettings.json",
      profiles: {
        https: {
          commandName: "Project",
          dotnetRunMessages: true,
          launchBrowser: true,
          applicationUrl: `https://localhost:${props.httpsPort};http://localhost:${props.httpPort}`,
          environmentVariables: {
            ASPNETCORE_ENVIRONMENT: "Development",
          },
        },
        http: {
          commandName: "Project",
          dotnetRunMessages: true,
          launchBrowser: true,
          applicationUrl: `http://localhost:${props.httpPort}`,
          environmentVariables: {
            ASPNETCORE_ENVIRONMENT: "Development",
          },
        },
      },
    },
    null,
    4,
  );

  return (
    <SourceDirectory path="Properties">
      <SourceFile filetype="json" path="launchSettings.json">
        {launchSettings}
      </SourceFile>
    </SourceDirectory>
  );
}

/**
 * Renders appsettings.json for the ASP.NET project.
 */
export function AppSettings(): Children {
  const appSettings = JSON.stringify(
    {
      Logging: {
        LogLevel: {
          Default: "Information",
          "Microsoft.AspNetCore": "Warning",
        },
      },
      AllowedHosts: "*",
    },
    null,
    2,
  );

  const devAppSettings = JSON.stringify(
    {
      Logging: {
        LogLevel: {
          Default: "Information",
          "Microsoft.AspNetCore": "Warning",
        },
      },
    },
    null,
    2,
  );

  return (
    <>
      <SourceFile filetype="json" path="appsettings.json">
        {appSettings}
      </SourceFile>
      <SourceFile filetype="json" path="appsettings.Development.json">
        {devAppSettings}
      </SourceFile>
    </>
  );
}
