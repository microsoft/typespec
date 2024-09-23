// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
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

        public static string GetExpectedFromFile(string? parameters = null)
        {
            return File.ReadAllText(GetAssetFileOrDirectoryPath(true, parameters));
        }

        private static string GetAssetFileOrDirectoryPath(bool isFile, string? parameters = null)
        {
            var stackTrace = new StackTrace();
            var stackFrame = GetRealMethodInvocation(stackTrace);
            var method = stackFrame.GetMethod();
            var callingClass = method!.DeclaringType;
            var nsSplit = callingClass!.Namespace!.Split('.');
            var paramString = parameters is null ? string.Empty : $"({parameters})";
            var extName = isFile ? ".cs" : string.Empty;
            var path = _assemblyLocation;
            var nsSkip = nsSplit.Contains("ClientModel") ? 5 : 4;
            for (int i = nsSkip; i < nsSplit.Length; i++)
            {
                path = Path.Combine(path, nsSplit[i]);
            }
            return Path.Combine(path, "TestData", callingClass.Name, $"{method.Name}{paramString}{extName}");
        }

        private static StackFrame GetRealMethodInvocation(StackTrace stackTrace)
        {
            int i = 1;
            while (i < stackTrace.FrameCount)
            {
                var frame = stackTrace.GetFrame(i);
                var declaringType = frame!.GetMethod()!.DeclaringType!;
                // we need to skip those method invocations from this class, or from the async state machine when the caller is an async method
                if (declaringType != typeof(Helpers) && declaringType.Name != "MockHelpers" && !IsCompilerGenerated(declaringType))
                {
                    return frame;
                }
                i++;
            }

            throw new InvalidOperationException($"There is no method invocation outside the {typeof(Helpers)} class in the stack trace");

            static bool IsCompilerGenerated(Type type)
            {
                return type.IsDefined(typeof(CompilerGeneratedAttribute), false) || (type.Namespace?.StartsWith("System.Runtime.CompilerServices") ?? false) ||
                    type.Name.StartsWith("<<", StringComparison.Ordinal);
            }
        }

        public static async Task<Compilation> GetCompilationFromDirectoryAsync(string? parameters = null)
        {
            var directory = GetAssetFileOrDirectoryPath(false, parameters);
            var codeGenAttributeFiles = Path.Combine(_assemblyLocation, "..", "..", "..", "..", "..", "Microsoft.Generator.CSharp.Customization", "src");
            var workspace = GeneratedCodeWorkspace.CreateExistingCodeProject([directory, codeGenAttributeFiles], Path.Combine(directory, "Generated"));
            return await workspace.GetCompilationAsync();
        }
    }
}
