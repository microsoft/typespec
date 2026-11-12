import { type Children } from "@alloy-js/core";
import { CsprojFile } from "@alloy-js/csharp";
import {
  ImplicitUsings,
  ItemGroup,
  Nullable,
  PackageReference,
  PropertyGroup,
  TargetFramework,
} from "@alloy-js/msbuild/components";

export interface CsprojProps {
  /** The project name (without extension). */
  projectName: string;
  /** Whether to include SwaggerUI NuGet package. */
  useSwaggerUI?: boolean;
}

/**
 * Renders a .csproj file for the ASP.NET service project.
 */
export function Csproj(props: CsprojProps): Children {
  return (
    <CsprojFile path={`${props.projectName}.csproj`} sdk="Microsoft.NET.Sdk.Web">
      <PropertyGroup>
        <TargetFramework>net9.0</TargetFramework>
        <Nullable>enable</Nullable>
        <ImplicitUsings>enable</ImplicitUsings>
      </PropertyGroup>
      {props.useSwaggerUI && (
        <ItemGroup>
          <PackageReference Include="SwashBuckle.AspNetCore" Version="7.3.1" />
        </ItemGroup>
      )}
    </CsprojFile>
  );
}
