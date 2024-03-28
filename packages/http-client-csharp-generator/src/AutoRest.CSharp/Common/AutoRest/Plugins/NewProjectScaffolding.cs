// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.Common.AutoRest.Plugins
{
    internal class NewProjectScaffolding
    {
        private string _serviceDirectoryName;
        private string _projectDirectory;
        private string _testDirectory;
        private string _serviceDirectory;
        private bool _isAzureSdk;
        private bool _needAzureKeyAuth;

        public NewProjectScaffolding(bool needAzureKeyAuth)
        {
            _serviceDirectoryName = Path.GetFileName(Path.GetFullPath(Path.Combine(Configuration.AbsoluteProjectFolder, "..", "..")));
            _projectDirectory = Path.Combine(Configuration.AbsoluteProjectFolder, "..");
            _testDirectory = Path.Combine(Configuration.AbsoluteProjectFolder, "..", "tests");
            _serviceDirectory = Path.Combine(Configuration.AbsoluteProjectFolder, "..", "..");
            _isAzureSdk = Configuration.Namespace.StartsWith("Azure.");
            _needAzureKeyAuth = needAzureKeyAuth;
        }

        public async Task<bool> Execute()
        {
            if (!_isAzureSdk)
            {
                //clean up old sln and csproj files
                foreach (var file in Directory.GetFiles(_projectDirectory, "*.csproj", SearchOption.AllDirectories))
                {
                    File.Delete(file);
                }
                foreach (var file in Directory.GetFiles(_projectDirectory, "*.sln", SearchOption.AllDirectories))
                {
                    File.Delete(file);
                }
            }

            if (_isAzureSdk)
                await WriteServiceDirectoryFiles();

            await WriteSolutionFiles();

            await WriteProjectFiles();

            await WriteTestFiles();

            return true;
        }

        private async Task WriteServiceDirectoryFiles()
        {
            //TODO handle existing ci where multiple projects are in the same service directory
            string ciYmlFile = Path.Combine(_serviceDirectory, "ci.yml");
            if (!File.Exists(ciYmlFile))
                await File.WriteAllBytesAsync(ciYmlFile, Encoding.ASCII.GetBytes(GetCiYml()));
        }

        private async Task WriteTestFiles()
        {
            if (!Configuration.GenerateTestProject && !Configuration.GenerateSampleProject)
                return;

            if (_isAzureSdk)
            {
                Directory.CreateDirectory(Path.Combine(_testDirectory, "SessionRecords"));
            }
            if (!Directory.Exists(_testDirectory))
                Directory.CreateDirectory(_testDirectory);

            await File.WriteAllBytesAsync(Path.Combine(_testDirectory, $"{Configuration.Namespace}.Tests.csproj"), Encoding.ASCII.GetBytes(GetTestCSProj()));
        }

        private async Task WriteProjectFiles()
        {
            await File.WriteAllBytesAsync(Path.Combine(Configuration.AbsoluteProjectFolder, $"{Configuration.Namespace}.csproj"), Encoding.ASCII.GetBytes(GetSrcCSProj()));
            if (_isAzureSdk)
            {
                Directory.CreateDirectory(Path.Combine(Configuration.AbsoluteProjectFolder, "Properties"));
                await File.WriteAllBytesAsync(Path.Combine(Configuration.AbsoluteProjectFolder, "Properties", "AssemblyInfo.cs"), Encoding.ASCII.GetBytes(GetAssemblyInfo()));
            }
        }

        private async Task WriteSolutionFiles()
        {
            await File.WriteAllBytesAsync(Path.Combine(_projectDirectory, $"{Configuration.Namespace}.sln"), Encoding.ASCII.GetBytes(GetSln()));
            if (_isAzureSdk)
            {
                await File.WriteAllBytesAsync(Path.Combine(_projectDirectory, "Directory.Build.props"), Encoding.ASCII.GetBytes(GetDirectoryBuildProps()));
                await File.WriteAllBytesAsync(Path.Combine(_projectDirectory, "README.md"), Encoding.ASCII.GetBytes(GetReadme()));
                await File.WriteAllBytesAsync(Path.Combine(_projectDirectory, "CHANGELOG.md"), Encoding.ASCII.GetBytes(GetChangeLog()));
            }
        }

        private string GetAssemblyInfo()
        {
            const string assemblyInfoContent = @"// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo(""{0}.Tests, PublicKey=0024000004800000940000000602000000240000525341310004000001000100d15ddcb29688295338af4b7686603fe614abd555e09efba8fb88ee09e1f7b1ccaeed2e8f823fa9eef3fdd60217fc012ea67d2479751a0b8c087a4185541b851bd8b16f8d91b840e51b1cb0ba6fe647997e57429265e85ef62d565db50a69ae1647d54d7bd855e4db3d8a91510e5bcbd0edfbbecaa20a7bd9ae74593daa7b11b4"")]

// Replace Microsoft.Test with the correct resource provider namepace for your service and uncomment.
// See https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/azure-services-resource-providers
// for the list of possible values.
[assembly: Azure.Core.AzureResourceProviderNamespace(""Microsoft.Template"")]
";
            return string.Format(assemblyInfoContent, Configuration.Namespace);
        }

        private string GetChangeLog()
        {
            const string changeLogContent = @"# Release History

## 1.0.0-beta.1 (Unreleased)

### Features Added

### Breaking Changes

### Bugs Fixed

### Other Changes
";
            return changeLogContent;
        }

        private string GetReadme()
        {
            const string readmeContent = @"# {0} client library for .NET

{0} is a managed service that helps developers get secret simply and securely.

Use the client library for to:

* [Get secret](https://docs.microsoft.com/azure)

[Source code][source_root] | [Package (NuGet)][package] | [API reference documentation][reference_docs] | [Product documentation][azconfig_docs] | [Samples][source_samples]

  [Source code](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/{1}/{0}/src) | [Package (NuGet)](https://www.nuget.org/packages) | [API reference documentation](https://azure.github.io/azure-sdk-for-net) | [Product documentation](https://docs.microsoft.com/azure)

## Getting started

This section should include everything a developer needs to do to install and create their first client connection *very quickly*.

### Install the package

First, provide instruction for obtaining and installing the package or library. This section might include only a single line of code, like `dotnet add package package-name`, but should enable a developer to successfully install the package from NuGet, npm, or even cloning a GitHub repository.

Install the client library for .NET with [NuGet](https://www.nuget.org/ ):

```dotnetcli
dotnet add package {0} --prerelease
```

### Prerequisites

Include a section after the install command that details any requirements that must be satisfied before a developer can [authenticate](#authenticate-the-client) and test all of the snippets in the [Examples](#examples) section. For example, for Cosmos DB:

> You must have an [Azure subscription](https://azure.microsoft.com/free/dotnet/) and [Cosmos DB account](https://docs.microsoft.com/azure/cosmos-db/account-overview) (SQL API). In order to take advantage of the C# 8.0 syntax, it is recommended that you compile using the [.NET Core SDK](https://dotnet.microsoft.com/download) 3.0 or higher with a [language version](https://docs.microsoft.com/dotnet/csharp/language-reference/configure-language-version#override-a-default) of `latest`.  It is also possible to compile with the .NET Core SDK 2.1.x using a language version of `preview`.

### Authenticate the client

If your library requires authentication for use, such as for Azure services, include instructions and example code needed for initializing and authenticating.

For example, include details on obtaining an account key and endpoint URI, setting environment variables for each, and initializing the client object.

## Key concepts

The *Key concepts* section should describe the functionality of the main classes. Point out the most important and useful classes in the package (with links to their reference pages) and explain how those classes work together. Feel free to use bulleted lists, tables, code blocks, or even diagrams for clarity.

Include the *Thread safety* and *Additional concepts* sections below at the end of your *Key concepts* section. You may remove or add links depending on what your library makes use of:

### Thread safety

We guarantee that all client instance methods are thread-safe and independent of each other ([guideline](https://azure.github.io/azure-sdk/dotnet_introduction.html#dotnet-service-methods-thread-safety)). This ensures that the recommendation of reusing client instances is always safe, even across threads.

### Additional concepts
<!-- CLIENT COMMON BAR -->
[Client options](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/README.md#configuring-service-clients-using-clientoptions) |
[Accessing the response](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/README.md#accessing-http-response-details-using-responset) |
[Long-running operations](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/README.md#consuming-long-running-operations-using-operationt) |
[Handling failures](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/README.md#reporting-errors-requestfailedexception) |
[Diagnostics](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/Diagnostics.md) |
[Mocking](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/README.md#mocking) |
[Client lifetime](https://devblogs.microsoft.com/azure-sdk/lifetime-management-and-thread-safety-guarantees-of-azure-sdk-net-clients/)
<!-- CLIENT COMMON BAR -->

## Examples

You can familiarize yourself with different APIs using [Samples](https://github.com/Azure/azure-sdk-for-net/tree/main/sdk/{1}/{0}/samples).

## Troubleshooting

Describe common errors and exceptions, how to ""unpack"" them if necessary, and include guidance for graceful handling and recovery.

Provide information to help developers avoid throttling or other service-enforced errors they might encounter. For example, provide guidance and examples for using retry or connection policies in the API.

If the package or a related package supports it, include tips for logging or enabling instrumentation to help them debug their code.

## Next steps

* Provide a link to additional code examples, ideally to those sitting alongside the README in the package's `/samples` directory.
* If appropriate, point users to other packages that might be useful.
* If you think there's a good chance that developers might stumble across your package in error (because they're searching for specific functionality and mistakenly think the package provides that functionality), point them to the packages they might be looking for.

## Contributing

This is a template, but your SDK readme should include details on how to contribute code to the repo/package.

<!-- LINKS -->
[style-guide-msft]: https://docs.microsoft.com/style-guide/capitalization
[style-guide-cloud]: https://aka.ms/azsdk/cloud-style-guide

![Impressions](https://azure-sdk-impressions.azurewebsites.net/api/impressions/azure-sdk-for-net/sdk/{1}/{0}/README.png)
";
            return string.Format(readmeContent, Configuration.Namespace, _serviceDirectoryName);
        }

        private string GetCiYml()
        {
            string safeName = Configuration.Namespace.Replace(".", "");
            const string ciYmlContent = @"# NOTE: Please refer to https://aka.ms/azsdk/engsys/ci-yaml before editing this file.

trigger:
  branches:
    include:
    - main
    - hotfix/*
    - release/*
  paths:
    include:
    - sdk/{0}
    - sdk/{0}/ci.yml
    - sdk/{0}/{1}

pr:
  branches:
    include:
    - main
    - feature/*
    - hotfix/*
    - release/*
  paths:
    include:
    - sdk/{0}
    - sdk/{0}/ci.yml
    - sdk/{0}/{1}

extends:
  template: /eng/pipelines/templates/stages/archetype-sdk-client.yml
  parameters:
    ServiceDirectory: {0}
    ArtifactName: packages
    Artifacts:
    - name: {1}
      safeName: {2}
";
            return string.Format(ciYmlContent, _serviceDirectoryName, Configuration.Namespace, safeName);
        }

        private string GetDirectoryBuildProps()
        {
            const string directoryBuildPropsContent = @"<Project ToolsVersion=""15.0"" xmlns=""http://schemas.microsoft.com/developer/msbuild/2003"">
  <!--
    Add any shared properties you want for the projects under this package directory that need to be set before the auto imported Directory.Build.props
  -->
  <Import Project=""$([MSBuild]::GetDirectoryNameOfFileAbove($(MSBuildThisFileDirectory).., Directory.Build.props))\Directory.Build.props"" />
</Project>
";
            return directoryBuildPropsContent;
        }

        private string GetBrandedSrcCSProj()
        {
            var builder = new CSProjWriter()
            {
                Description = $"This is the {Configuration.Namespace} client library for developing .NET applications with rich experience.",
                AssemblyTitle = $"Azure SDK Code Generation {Configuration.Namespace} for Azure Data Plane",
                Version = "1.0.0-beta.1",
                PackageTags = Configuration.Namespace,
                TargetFrameworks = "$(RequiredTargetFrameworks)",
                IncludeOperationsSharedSource = true,
            };
            // only branded library will add these shared code compilation lines
            builder.CompileIncludes.Add(new("$(AzureCoreSharedSources)AzureResourceProviderNamespaceAttribute.cs", "Shared/Core"));
            if (_needAzureKeyAuth)
                builder.CompileIncludes.Add(new("$(AzureCoreSharedSources)AzureKeyCredentialPolicy.cs", "Shared/Core"));
            foreach (var packages in _brandedDependencyPackages)
            {
                builder.PackageReferences.Add(packages);
            }
            // TODO -- add this to _brandedDependencyPackages when we remove this flag
            if (Configuration.UseModelReaderWriter)
            {
                builder.PackageReferences.Add(new("System.ClientModel"));
            }

            return builder.Write();
        }

        private string GetUnbrandedSrcCSProj()
        {
            var builder = new CSProjWriter()
            {
                Description = $"This is the {Configuration.Namespace} client library for developing .NET applications with rich experience.",
                AssemblyTitle = $"SDK Code Generation {Configuration.Namespace}",
                Version = "1.0.0-beta.1",
                PackageTags = Configuration.Namespace,
                TargetFramework = "netstandard2.0",
                LangVersion = "latest",
                GenerateDocumentationFile = true,
            };
            foreach (var packages in _unbrandedDependencyPackages)
            {
                builder.PackageReferences.Add(packages);
            }

            return builder.Write();
        }

        private string GetSrcCSProj() => Configuration.IsBranded ? GetBrandedSrcCSProj() : GetUnbrandedSrcCSProj();

        private static readonly IReadOnlyList<CSProjWriter.CSProjDependencyPackage> _brandedDependencyPackages = new CSProjWriter.CSProjDependencyPackage[]
        {
            new("Azure.Core"),
            new("System.Text.Json")
        };
        private static readonly IReadOnlyList<CSProjWriter.CSProjDependencyPackage> _unbrandedDependencyPackages = new CSProjWriter.CSProjDependencyPackage[]
        {
            new("System.ClientModel", "1.0.0-beta.3"),
            new("System.Text.Json", "4.7.2")
        };

        private static readonly IReadOnlyList<CSProjWriter.CSProjDependencyPackage> _brandedTestDependencyPackages = new CSProjWriter.CSProjDependencyPackage[]
        {
            new("Azure.Identity"),
            new("NUnit"),
            new("NUnit3TestAdapter"),
            new("Microsoft.NET.Test.Sdk"),
            new("Moq")
        };
        private static readonly IReadOnlyList<CSProjWriter.CSProjDependencyPackage> _unbrandedTestDependencyPackages = new CSProjWriter.CSProjDependencyPackage[]
        {
            new("NUnit", "3.13.2"),
            new("NUnit3TestAdapter", "4.4.2"),
            new("Microsoft.NET.Test.Sdk", "17.0.0"),
            new("Moq", "[4.18.2]")
        };

        private string GetBrandedTestCSProj()
        {
            var writer = new CSProjWriter()
            {
                TargetFrameworks = "$(RequiredTargetFrameworks)",
                NoWarn = new("$(NoWarn);CS1591", "We don't care about XML doc comments on test types and members")
            };

            // add the project references
            if (_isAzureSdk)
            {
                writer.ProjectReferences.Add(new("$(AzureCoreTestFramework)"));
            }
            writer.ProjectReferences.Add(new($"..\\src\\{Configuration.Namespace}.csproj"));
            // add the package references
            foreach (var package in _brandedTestDependencyPackages)
            {
                writer.PackageReferences.Add(package);
            }

            return writer.Write();
        }

        private string GetUnbrandedTestCSProj()
        {
            var writer = new CSProjWriter()
            {
                TargetFramework = "net7.0",
                NoWarn = new("$(NoWarn);CS1591", "Ignore XML doc comments on test types and members")
            };

            // add the project references
            writer.ProjectReferences.Add(new($"..\\src\\{Configuration.Namespace}.csproj"));
            // add the package references
            foreach (var package in _unbrandedTestDependencyPackages)
            {
                writer.PackageReferences.Add(package);
            }

            return writer.Write();
        }

        private string GetTestCSProj() => Configuration.IsBranded ? GetBrandedTestCSProj() : GetUnbrandedTestCSProj();

        private string GetSln()
        {
            string slnContent = @"Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29709.97
MinimumVisualStudioVersion = 10.0.40219.1
";
            if (_isAzureSdk)
            {
                slnContent += @"Project(""{{9A19103F-16F7-4668-BE54-9A1E7A4F7556}}"") = ""Azure.Core.TestFramework"", ""..\..\core\Azure.Core.TestFramework\src\Azure.Core.TestFramework.csproj"", ""{{ECC730C1-4AEA-420C-916A-66B19B79E4DC}}""
EndProject
";
            }
            slnContent += @"Project(""{{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}}"") = ""{0}"", ""src\{0}.csproj"", ""{{28FF4005-4467-4E36-92E7-DEA27DEB1519}}""
EndProject
";
            if (Configuration.GenerateTestProject || Configuration.GenerateSampleProject)
            {
                slnContent += @"Project(""{{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}}"") = ""{0}.Tests"", ""tests\{0}.Tests.csproj"", ""{{1F1CD1D4-9932-4B73-99D8-C252A67D4B46}}""
EndProject
";
            }
            slnContent += @"Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{{B0C276D1-2930-4887-B29A-D1A33E7009A2}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{B0C276D1-2930-4887-B29A-D1A33E7009A2}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{B0C276D1-2930-4887-B29A-D1A33E7009A2}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{B0C276D1-2930-4887-B29A-D1A33E7009A2}}.Release|Any CPU.Build.0 = Release|Any CPU
		{{8E9A77AC-792A-4432-8320-ACFD46730401}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{8E9A77AC-792A-4432-8320-ACFD46730401}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{8E9A77AC-792A-4432-8320-ACFD46730401}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{8E9A77AC-792A-4432-8320-ACFD46730401}}.Release|Any CPU.Build.0 = Release|Any CPU
";
            if (_isAzureSdk)
            {
                slnContent += @"		{{ECC730C1-4AEA-420C-916A-66B19B79E4DC}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{ECC730C1-4AEA-420C-916A-66B19B79E4DC}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{ECC730C1-4AEA-420C-916A-66B19B79E4DC}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{ECC730C1-4AEA-420C-916A-66B19B79E4DC}}.Release|Any CPU.Build.0 = Release|Any CPU
";
            }
            slnContent += @"		{{A4241C1F-A53D-474C-9E4E-075054407E74}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{A4241C1F-A53D-474C-9E4E-075054407E74}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{A4241C1F-A53D-474C-9E4E-075054407E74}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{A4241C1F-A53D-474C-9E4E-075054407E74}}.Release|Any CPU.Build.0 = Release|Any CPU
		{{FA8BD3F1-8616-47B6-974C-7576CDF4717E}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{FA8BD3F1-8616-47B6-974C-7576CDF4717E}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{FA8BD3F1-8616-47B6-974C-7576CDF4717E}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{FA8BD3F1-8616-47B6-974C-7576CDF4717E}}.Release|Any CPU.Build.0 = Release|Any CPU
		{{85677AD3-C214-42FA-AE6E-49B956CAC8DC}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{85677AD3-C214-42FA-AE6E-49B956CAC8DC}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{85677AD3-C214-42FA-AE6E-49B956CAC8DC}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{85677AD3-C214-42FA-AE6E-49B956CAC8DC}}.Release|Any CPU.Build.0 = Release|Any CPU
		{{28FF4005-4467-4E36-92E7-DEA27DEB1519}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{28FF4005-4467-4E36-92E7-DEA27DEB1519}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{28FF4005-4467-4E36-92E7-DEA27DEB1519}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{28FF4005-4467-4E36-92E7-DEA27DEB1519}}.Release|Any CPU.Build.0 = Release|Any CPU
		{{1F1CD1D4-9932-4B73-99D8-C252A67D4B46}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{{1F1CD1D4-9932-4B73-99D8-C252A67D4B46}}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{{1F1CD1D4-9932-4B73-99D8-C252A67D4B46}}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{{1F1CD1D4-9932-4B73-99D8-C252A67D4B46}}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {{A97F4B90-2591-4689-B1F8-5F21FE6D6CAE}}
	EndGlobalSection
EndGlobal
";
            return string.Format(slnContent, Configuration.Namespace);
        }
    }
}
