// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;

namespace PlaygroundServer;

internal static class GeneratorProcess
{
    internal static ProcessStartInfo CreateStartInfo(string generatorPath, string outputDirectory, string generatorName) => new()
    {
        FileName = "dotnet",
        ArgumentList = { "--roll-forward", "Major", generatorPath, outputDirectory, "-g", generatorName, "--new-project", "--hosted" },
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
    };
}
