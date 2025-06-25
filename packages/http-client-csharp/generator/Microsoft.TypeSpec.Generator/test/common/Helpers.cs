// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Formatting;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Common
{
    public static class Helpers
    {
        private static readonly string _assemblyLocation = Path.GetDirectoryName(typeof(Helpers).Assembly.Location)!;

        public static string GetExpectedFromFile(
            string? parameters = null,
            [CallerMemberName] string method = "",
            [CallerFilePath] string filePath = "")
        {
            return File.ReadAllText(GetAssetFileOrDirectoryPath(true, parameters, method, filePath));
        }

        public static string GetAssetFileOrDirectoryPath(
            bool isFile,
            string? parameters = null,
            [CallerMemberName] string method = "",
            [CallerFilePath] string filePath = "")
        {

            var callingClass =  Path.GetFileName(filePath).Split('.').First();
            var paramString = parameters is null ? string.Empty : $"({parameters})";
            var extName = isFile ? ".cs" : string.Empty;

            return Path.Combine(Path.GetDirectoryName(filePath)!, "TestData", callingClass, $"{method}{paramString}{extName}");
        }


        public static async Task<Compilation> GetCompilationFromDirectoryAsync(
            string? parameters = null,
            [CallerMemberName] string method = "",
            [CallerFilePath] string filePath = "")
        {
            var directory = GetAssetFileOrDirectoryPath(false, parameters, method, filePath);
            var codeGenAttributeFiles = Path.Combine(_assemblyLocation, "..", "..", "..", "..", "..", "TestProjects", "Local", "Sample-TypeSpec", "src", "Generated", "Internal");
            var project = CreateExistingCodeProject([directory, codeGenAttributeFiles], Path.Combine(directory, "Generated"));
            var compilation = await project.GetCompilationAsync();
            Assert.IsNotNull(compilation);
            return compilation!;
        }

        private static Project CreateExistingCodeProject(IEnumerable<string> projectDirectories, string generatedDirectory)
        {
            var workspace = new AdhocWorkspace();
            var newOptionSet = workspace.Options.WithChangedOption(FormattingOptions.NewLine, LanguageNames.CSharp, "\n");
            workspace.TryApplyChanges(workspace.CurrentSolution.WithOptions(newOptionSet));
            Project project = workspace.AddProject("ExistingCode", LanguageNames.CSharp);

            foreach (var projectDirectory in projectDirectories)
            {
                if (Path.IsPathRooted(projectDirectory))
                {
                    project = GeneratedCodeWorkspace.AddDirectory(project, Path.GetFullPath(projectDirectory), skipPredicate: sourceFile => sourceFile.StartsWith(generatedDirectory));
                }
            }

            project = project
                .AddMetadataReferences([
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    ..CodeModelGenerator.Instance.AdditionalMetadataReferences
                    ])
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: new WorkspaceMetadataReferenceResolver(), nullableContextOptions: NullableContextOptions.Disable));

            return project;
        }
    }
}
