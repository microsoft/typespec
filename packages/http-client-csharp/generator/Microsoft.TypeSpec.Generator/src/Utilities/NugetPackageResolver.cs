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
        /// When <paramref name="minVersion"/> is provided, only versions greater than or equal to it are considered
        /// (so directory names that do not parse as <see cref="NuGetVersion"/> are skipped). When it is omitted, all
        /// version directories are probed: parseable names first in semantic-descending order, then any remaining
        /// directories in lexicographic-descending order so callers that pre-date the SemVer-aware overload (e.g.
        /// the package-reference walker) keep their original probe set.
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

            var allDirs = Directory.GetDirectories(packageDir);

            var parseableDirs = allDirs
                .Select(dir => (Dir: dir, Version: NuGetVersion.TryParse(Path.GetFileName(dir), out var v) ? v : null))
                .Where(t => t.Version != null && (minParsed == null || t.Version >= minParsed))
                .OrderByDescending(t => t.Version)
                .Select(t => t.Dir);

            foreach (var dir in parseableDirs)
            {
                var found = TryFindAssemblyInVersionDir(dir, packageName);
                if (found != null)
                {
                    return found;
                }
            }

            // Back-compat fallback: when no MinVersion was supplied, also probe directories whose names do
            // not parse as NuGetVersion (e.g. exotic pre-release labels) in lexicographic-descending order
            // so the original PR #10229 behavior for AddPackageReferencesFromProject is preserved.
            if (minParsed == null)
            {
                var notParseableDirs = allDirs
                    .Where(d => !NuGetVersion.TryParse(Path.GetFileName(d), out _))
                    .OrderByDescending(Path.GetFileName, StringComparer.Ordinal);
                foreach (var dir in notParseableDirs)
                {
                    var found = TryFindAssemblyInVersionDir(dir, packageName);
                    if (found != null)
                    {
                        return found;
                    }
                }
            }

            return null;
        }

        private static string? TryFindAssemblyInVersionDir(string versionDir, string packageName)
        {
            foreach (var tfm in NugetPackageDownloader.PreferredDotNetFrameworkVersions)
            {
                var assemblyPath = Path.Combine(versionDir, "lib", tfm, $"{packageName}.dll");
                if (File.Exists(assemblyPath))
                {
                    return assemblyPath;
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
