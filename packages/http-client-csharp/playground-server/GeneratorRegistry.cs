// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace PlaygroundServer;

internal sealed class GeneratorRegistry(string defaultPath, string? azurePath = null)
{
    internal const string DefaultGeneratorName = "ScmCodeModelGenerator";

    internal IEnumerable<string> Paths => string.IsNullOrEmpty(azurePath)
        ? [defaultPath]
        : new[] { defaultPath, azurePath }.Distinct(StringComparer.Ordinal);

    internal string? GetPath(string generatorName) => generatorName switch
    {
        DefaultGeneratorName => defaultPath,
        "AzureClientGenerator" or "ManagementClientGenerator" or "ProvisioningGenerator" =>
            string.IsNullOrEmpty(azurePath) ? null : azurePath,
        _ => null,
    };
}
