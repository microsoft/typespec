// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.IO;

namespace TypeSpec.Generator.Tests
{
    internal static class Helpers
    {
        private static readonly string _assemblyLocation = Path.GetDirectoryName(typeof(Helpers).Assembly.Location)!;

        public static string GetExpectedFromFile(string? parameters = null)
        {
            var stackTrace = new StackTrace();
            var stackFrame = stackTrace.GetFrame(1);
            var method = stackFrame!.GetMethod();
            var callingClass = method!.DeclaringType;
            var nsSplit = callingClass!.Namespace!.Split('.');
            var ns = nsSplit[nsSplit.Length - 1];
            var paramString = parameters is null ? string.Empty : $"({parameters})";
            return File.ReadAllText(Path.Combine(_assemblyLocation, ns, "TestData", callingClass.Name, $"{method.Name}{paramString}.cs"));
        }
    }
}
