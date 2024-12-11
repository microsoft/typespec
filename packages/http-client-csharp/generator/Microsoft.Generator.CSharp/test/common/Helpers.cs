// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.Tests.Common
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
            var codeGenAttributeFiles = Path.Combine(_assemblyLocation, "..", "..", "..", "..", "..", "Microsoft.Generator.CSharp.Customization", "src");
            var workspace = GeneratedCodeWorkspace.CreateExistingCodeProject([directory, codeGenAttributeFiles], Path.Combine(directory, "Generated"));
            return await workspace.GetCompilationAsync();
        }
    }
}
