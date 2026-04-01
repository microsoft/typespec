// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    //TODO Need to define the rest of the extensibility points https://github.com/microsoft/typespec/issues/4065
    public class NewProjectScaffolding
    {
        public async Task<bool> Execute()
        {
            //clean up old sln, slnx and csproj files
            foreach (var file in Directory.GetFiles(CodeModelGenerator.Instance.Configuration.OutputDirectory, "*.csproj", SearchOption.AllDirectories))
            {
                File.Delete(file);
            }
            foreach (var file in Directory.GetFiles(CodeModelGenerator.Instance.Configuration.OutputDirectory, "*.sln", SearchOption.TopDirectoryOnly))
            {
                File.Delete(file);
            }
            foreach (var file in Directory.GetFiles(CodeModelGenerator.Instance.Configuration.OutputDirectory, "*.slnx", SearchOption.TopDirectoryOnly))
            {
                File.Delete(file);
            }

            await WriteSolutionFiles();

            await WriteProjectFiles();

            return true;
        }

        private async Task WriteProjectFiles()
        {
            await File.WriteAllBytesAsync(
                Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{CodeModelGenerator.Instance.Configuration.PackageName}.csproj"),
                Encoding.UTF8.GetBytes(NormalizeLineEndings(GetSourceProjectFileContent())));
        }

        private string NormalizeLineEndings(string content)
        {
            return content.Replace("\\r\\n", "\\n", StringComparison.Ordinal);
        }

        private async Task WriteSolutionFiles()
        {
            await File.WriteAllBytesAsync(
                Path.Combine(CodeModelGenerator.Instance.Configuration.OutputDirectory, $"{CodeModelGenerator.Instance.Configuration.PackageName}.slnx"),
                Encoding.UTF8.GetBytes(NormalizeLineEndings(GetSolutionFileContent())));
        }

        protected virtual string GetSourceProjectFileContent()
        {
            var builder = new CSharpProjectWriter()
            {
                Description = $"This is the {CodeModelGenerator.Instance.Configuration.PackageName} client library for developing .NET applications with rich experience.",
                AssemblyTitle = $"SDK Code Generation {CodeModelGenerator.Instance.Configuration.PackageName}",
                Version = "1.0.0-beta.1",
                PackageTags = CodeModelGenerator.Instance.Configuration.PackageName,
                TargetFrameworks = "netstandard2.0;net8.0",
                LangVersion = "latest",
                GenerateDocumentationFile = true,
            };
            foreach (var packages in _unbrandedDependencyPackages)
            {
                builder.PackageReferences.Add(packages);
            }
            foreach (var compileInclude in CompileIncludes)
            {
                builder.CompileIncludes.Add(compileInclude);
            }

            // Add pack items for ConfigurationSchema.json and .targets file
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            var schemaPath = Path.Combine(CodeModelGenerator.Instance.Configuration.OutputDirectory, "schema", "ConfigurationSchema.json");
            if (File.Exists(schemaPath))
            {
                builder.PackItems.Add(new CSharpProjectWriter.CSProjPackItem(@"..\schema\ConfigurationSchema.json", @"\"));
                builder.PackItems.Add(new CSharpProjectWriter.CSProjPackItem($@"..\{packageName}.NuGet.targets", @"buildTransitive\netstandard2.0\" + $"{packageName}.targets"));
            }

            return builder.Write();
        }

        private IReadOnlyList<CSharpProjectCompileInclude>? _compileIncludes;
        public IReadOnlyList<CSharpProjectCompileInclude> CompileIncludes => _compileIncludes ??= BuildCompileIncludes();

        protected virtual IReadOnlyList<CSharpProjectCompileInclude> BuildCompileIncludes() => [];

        private static readonly IReadOnlyList<CSharpProjectWriter.CSProjDependencyPackage> _unbrandedDependencyPackages = new CSharpProjectWriter.CSProjDependencyPackage[]
        {
            new("System.ClientModel", "1.10.0"),
        };

        protected virtual string GetSolutionFileContent()
        {
            return string.Format(
                @"<Solution>
  <Project Path=""src\{0}.csproj"" />
</Solution>
", CodeModelGenerator.Instance.Configuration.PackageName);
        }
    }
}
