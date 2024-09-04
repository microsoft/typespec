// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.Tests
{
    internal static class Helpers
    {
        private static readonly string _assemblyLocation = Path.GetDirectoryName(typeof(Helpers).Assembly.Location)!;

        public static string GetExpectedFromFile(string? parameters = null)
        {
            return File.ReadAllText(GetAssetFilePath(parameters));
        }

        private static string GetAssetFilePath(string? parameters = null)
        {
            var stackTrace = new StackTrace();
            var stackFrame = GetRealMethodInvocation(stackTrace);
            var method = stackFrame.GetMethod();
            var callingClass = method!.DeclaringType;
            var nsSplit = callingClass!.Namespace!.Split('.');
            var ns = nsSplit[^1];
            var paramString = parameters is null ? string.Empty : $"({parameters})";
            return Path.Combine(_assemblyLocation, ns, "TestData", callingClass.Name, $"{method.Name}{paramString}.cs");
        }

        private static StackFrame GetRealMethodInvocation(StackTrace stackTrace)
        {
            int i = 1;
            while (i < stackTrace.FrameCount)
            {
                var frame = stackTrace.GetFrame(i);
                if (frame!.GetMethod()!.DeclaringType != typeof(Helpers))
                {
                    return frame;
                }
                i++;
            }

            throw new InvalidOperationException($"There is no method invocation outside the {typeof(Helpers)} class in the stack trace");
        }

        public static Compilation GetCompilationFromFile(string? parameters = null)
        {
            SyntaxTree syntaxTree = CSharpSyntaxTree.ParseText(File.ReadAllText(GetAssetFilePath(parameters)));
            CSharpCompilation compilation = CSharpCompilation.Create("ExistingCode")
                .WithOptions(new CSharpCompilationOptions(OutputKind.ConsoleApplication))
                .AddReferences(MetadataReference.CreateFromFile(typeof(object).Assembly.Location))
                .AddSyntaxTrees(syntaxTree);

            return compilation;
        }
    }
}
