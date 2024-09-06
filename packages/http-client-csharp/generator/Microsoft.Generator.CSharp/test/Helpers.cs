// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.Tests
{
    internal static class Helpers
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
            var ns = nsSplit[^1];
            var paramString = parameters is null ? string.Empty : $"({parameters})";
            var extName = isFile ? ".cs" : string.Empty;
            return Path.Combine(_assemblyLocation, ns, "TestData", callingClass.Name, $"{method.Name}{paramString}{extName}");
        }

        private static StackFrame GetRealMethodInvocation(StackTrace stackTrace)
        {
            int i = 1;
            while (i < stackTrace.FrameCount)
            {
                var frame = stackTrace.GetFrame(i);
                var declaringType = frame!.GetMethod()!.DeclaringType!;
                // we need to skip those method invocations from this class, or from the async state machine when the caller is an async method
                if (declaringType != typeof(Helpers) && !IsCompilerGenerated(declaringType))
                {
                    return frame;
                }
                i++;
            }

            throw new InvalidOperationException($"There is no method invocation outside the {typeof(Helpers)} class in the stack trace");

            static bool IsCompilerGenerated(Type type)
            {
                return type.IsDefined(typeof(CompilerGeneratedAttribute), false) || (type.Namespace?.StartsWith("System.Runtime.CompilerServices") ?? false);
            }
        }

        public static async Task<Compilation> GetCompilationFromDirectoryAsync(string? parameters = null)
        {
            var directory = GetAssetFileOrDirectoryPath(false, parameters);
            var workspace = GeneratedCodeWorkspace.CreateExistingCodeProject(directory, Path.Combine(directory, "Generated"));

            return await workspace.GetCompilationAsync();
        }
    }
}
