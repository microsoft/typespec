// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NuGet.Configuration;
using NuGet.Protocol;
using NuGet.Protocol.Core.Types;
using NuGet.Versioning;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Shared helpers for resolving NuGet package assemblies from the local cache or remote feeds.
    /// </summary>
    internal static class NugetPackageResolver
    {
        /// <summary>
        /// Searches the NuGet global packages folder for an assembly belonging to <paramref name="packageName"/>.
        /// When <paramref name="minVersion"/> is provided, only versions greater than or equal to it are considered.
        /// Returns the highest qualifying version's assembly path, or <c>null</c> if none is cached.
        /// </summary>
        public static string? FindPackageAssembly(string globalPackagesFolder, string packageName, string? minVersion = null)
        {
            var packageDir = Path.Combine(globalPackagesFolder, packageName.ToLowerInvariant());
            if (!Directory.Exists(packageDir))
            {
                return null;
            }

            NuGetVersion? minParsed = null;
            if (!string.IsNullOrEmpty(minVersion) && !NuGetVersion.TryParse(minVersion, out minParsed))
            {
                minParsed = null;
            }

            var candidateDirs = Directory.GetDirectories(packageDir)
                .Select(dir =>
                {
                    var name = Path.GetFileName(dir);
                    return NuGetVersion.TryParse(name, out var parsed) ? (Dir: dir, Version: parsed) : (Dir: dir, Version: (NuGetVersion?)null);
                })
                .Where(t => t.Version != null && (minParsed == null || t.Version >= minParsed))
                .OrderByDescending(t => t.Version)
                .ToList();

            foreach (var candidate in candidateDirs)
            {
                foreach (var tfm in NugetPackageDownloader.PreferredDotNetFrameworkVersions)
                {
                    var assemblyPath = Path.Combine(candidate.Dir, "lib", tfm, $"{packageName}.dll");
                    if (File.Exists(assemblyPath))
                    {
                        return assemblyPath;
                    }
                }
            }

            return null;
        }

        /// <summary>
        /// Queries the configured NuGet feeds for the latest stable version of <paramref name="packageName"/>.
        /// When <paramref name="minVersion"/> is provided, the latest stable version greater than or equal to it
        /// is returned (or <c>null</c> if no qualifying version exists on any reachable feed).
        /// </summary>
        public static async Task<string?> ResolveLatestPackageVersion(string packageName, ISettings nugetSettings, string? minVersion = null)
        {
            NuGetVersion? minParsed = null;
            if (!string.IsNullOrEmpty(minVersion) && !NuGetVersion.TryParse(minVersion, out minParsed))
            {
                minParsed = null;
            }

            var sources = SettingsUtility.GetEnabledSources(nugetSettings);
            using var cacheContext = new SourceCacheContext();
            foreach (var source in sources)
            {
                try
                {
                    var repository = Repository.Factory.GetCoreV3(source.Source);
                    var resource = await repository.GetResourceAsync<FindPackageByIdResource>();
                    var versions = await resource.GetAllVersionsAsync(
                        packageName, cacheContext, NuGet.Common.NullLogger.Instance, CancellationToken.None);
                    var latest = versions?
                        .Where(v => !v.IsPrerelease)
                        .Where(v => minParsed == null || v >= minParsed)
                        .OrderByDescending(v => v)
                        .FirstOrDefault();
                    if (latest != null)
                    {
                        return latest.ToString();
                    }
                }
                catch
                {
                    // Skip sources that fail (auth, network, etc.)
                }
            }

            return null;
        }
    }
}
