// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class LoggingHelpers
    {
        public static void LogElapsedTime(string message)
        {
            CodeModelGenerator.Instance.Emitter.Info(
                $"{message}. Total Elapsed time: {CodeModelGenerator.Instance.Stopwatch.Elapsed}");
        }
    }
}
