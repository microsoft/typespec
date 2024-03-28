// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.IO;
using System.Reflection;
using AutoRest.CSharp.AutoRest.Communication;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.AutoRest.Plugins
{
    // TODO -- move this somewhere else because it is no longer a "plugin"
    internal class CSharpProj
    {
        private readonly bool _needAzureKeyAuth;
        private readonly bool _includeDfe;

        public CSharpProj(bool needAzureKeyAuth, bool includeDfe)
        {
            _needAzureKeyAuth = needAzureKeyAuth;
            _includeDfe = includeDfe;
        }

        private static string GetVersion()
        {
            Assembly clientAssembly = Assembly.GetExecutingAssembly();

            AssemblyInformationalVersionAttribute? versionAttribute = clientAssembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>();
            if (versionAttribute == null)
            {
                throw new InvalidOperationException($"{nameof(AssemblyInformationalVersionAttribute)} is required on client SDK assembly '{clientAssembly.FullName}'");
            }

            string version = versionAttribute.InformationalVersion;

            int hashSeparator = version.IndexOf('+');
            if (hashSeparator != -1)
            {
                return version.Substring(0, hashSeparator);
            }

            return version;
        }

        public void Execute(IPluginCommunication autoRest)
            => WriteCSProjFiles(async (filename, text) =>
            {
                await autoRest.WriteFile(Path.Combine(Configuration.RelativeProjectFolder, filename), text, "source-file-csharp");
            });

        public void Execute()
            => WriteCSProjFiles(async (filename, text) =>
            {
                //TODO adding to workspace makes the formatting messed up since its a raw xml document
                //somewhere it tries to parse it as a syntax tree and when it converts back to text
                //its no longer valid xml.  We should consider a "raw files" concept in the work space
                //so the file writing can still remain in one place
                await File.WriteAllTextAsync(Path.Combine(Configuration.AbsoluteProjectFolder, filename), text);
            });

        private void WriteCSProjFiles(Action<string, string> writeFile)
        {
            // write src csproj
            var csprojContent = Configuration.SkipCSProjPackageReference ? GetCSProj() : GetExternalCSProj();
            writeFile($"{Configuration.Namespace}.csproj", csprojContent);

            // write test csproj when needed
            if (Configuration.MgmtTestConfiguration is not null)
            {
                var testCSProjContent = GetTestCSProj();
                string testGenProjectFolder;
                if (Configuration.MgmtTestConfiguration.OutputFolder is { } testGenProjectOutputFolder)
                {
                    testGenProjectFolder = Path.Combine(testGenProjectOutputFolder, "../");
                }
                else
                {
                    testGenProjectFolder = "../";
                }
                Console.WriteLine(Path.Combine(testGenProjectFolder, $"{Configuration.Namespace}.Tests.csproj"));
                writeFile(FormatPath(Path.Combine(testGenProjectFolder, $"{Configuration.Namespace}.Tests.csproj")), testCSProjContent);
            }
        }

        private static string FormatPath(string? path)
        {
            if (string.IsNullOrEmpty(path))
                return path ?? "";
            return Path.GetFullPath(path.TrimEnd('/', '\\')).Replace("\\", "/");
        }

        private string GetTestCSProj()
        {
            var writer = new CSProjWriter()
            {
                TargetFramework = "netstandard2.0",
                TreatWarningsAsErrors = true,
                Nullable = "annotations",
                IncludeManagementSharedCode = Configuration.AzureArm ? true : null,
            };

            writer.ProjectReferences.Add(new($"..\\src\\{Configuration.Namespace}.csproj"));

            writer.PackageReferences.Add(new("NUnit"));
            writer.PackageReferences.Add(new("Azure.Identity"));

            writer.CompileIncludes.Add(new("..\\..\\..\\..\\src\\assets\\TestFramework\\MockTestBase.cs"));
            writer.CompileIncludes.Add(new("..\\..\\..\\..\\src\\assets\\TestFramework\\RecordedTestAttribute.cs"));

            return writer.Write();
        }

        private string GetCSProj()
        {
            var builder = new CSProjWriter()
            {
                TargetFramework = "netstandard2.0",
                TreatWarningsAsErrors = true,
                Nullable = "annotations",
                IncludeManagementSharedCode = Configuration.AzureArm ? true : null,
                DefineConstants = !Configuration.AzureArm && !Configuration.Generation1ConvenienceClient ? new("$(DefineConstants);EXPERIMENTAL") : null
            };
            builder.PackageReferences.Add(new("Azure.Core"));
            if (_includeDfe)
            {
                builder.PackageReferences.Add(new("Azure.Core.Expressions.DataFactory"));
            }

            if (Configuration.AzureArm)
            {
                builder.PackageReferences.Add(new("Azure.ResourceManager"));
            }
            else if (!Configuration.Generation1ConvenienceClient)
            {
                builder.PackageReferences.Add(new("Azure.Core.Experimental"));
            }

            if (Configuration.UseModelReaderWriter)
            {
                builder.PackageReferences.Add(new("System.ClientModel"));
            }

            if (_needAzureKeyAuth)
            {
                builder.CompileIncludes.Add(new("$(AzureCoreSharedSources)AzureKeyCredentialPolicy.cs", "Shared/Core"));
            }

            return builder.Write();
        }

        private string GetExternalCSProj()
        {
            var writer = new CSProjWriter()
            {
                TargetFramework = "netstandard2.0",
                TreatWarningsAsErrors = true,
                Nullable = "annotations",
                IncludeManagementSharedCode = Configuration.AzureArm ? true : null,
                DefineConstants = !Configuration.AzureArm && !Configuration.Generation1ConvenienceClient ? new("$(DefineConstants);EXPERIMENTAL") : null,
                LangVersion = "11.0",
                IncludeGeneratorSharedCode = true,
                RestoreAdditionalProjectSources = "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-net/nuget/v3/index.json"
            };
            writer.PackageReferences.Add(new("Azure.Core"));
            if (_includeDfe)
            {
                writer.PackageReferences.Add(new("Azure.Core.Expressions.DataFactory"));
            }

            if (Configuration.UseModelReaderWriter)
            {
                writer.PackageReferences.Add(new("System.ClientModel"));
            }

            var version = GetVersion();

            writer.PrivatePackageReferences.Add(new("Microsoft.Azure.AutoRest.CSharp", version));

            return writer.Write();
        }
    }
}
