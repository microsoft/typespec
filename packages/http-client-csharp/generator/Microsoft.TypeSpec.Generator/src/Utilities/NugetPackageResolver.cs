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
        /// Version directories are probed in semantic-descending order, followed by any non-SemVer directories
        /// in lexicographic-descending order.
        /// </summary>
        public static string? FindPackageAssembly(
            string globalPackagesFolder,
            string packageName,
            string? packageVersionSpec = null)
        {
            var packageDir = Path.Combine(globalPackagesFolder, packageName.ToLowerInvariant());
            if (!Directory.Exists(packageDir))
            {
                return null;
            }

            var allDirs = Directory.GetDirectories(packageDir);
            VersionRange? versionRange = null;
            if (!string.IsNullOrEmpty(packageVersionSpec))
            {
                VersionRange.TryParse(packageVersionSpec, out versionRange);
            }

            var matchingDirs = allDirs
                .Select(dir => (Dir: dir, Version: NuGetVersion.TryParse(Path.GetFileName(dir), out var v) ? v : null))
                .Where(t => t.Version != null && IsVersionMatch(versionRange, t.Version));
            var parseableDirs = versionRange?.Float != null
                ? matchingDirs.OrderByDescending(t => t.Version)
                : versionRange != null
                    ? matchingDirs.OrderBy(t => t.Version)
                    : matchingDirs.OrderByDescending(t => t.Version);

            foreach (var candidate in parseableDirs)
            {
                var found = TryFindAssemblyInVersionDir(candidate.Dir, packageName);
                if (found != null)
                {
                    return found;
                }
            }

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

                var frameworkDirectory = Path.GetDirectoryName(assemblyPath)!;
                if (Directory.Exists(frameworkDirectory))
                {
                    var firstAssembly = Directory.EnumerateFiles(
                        frameworkDirectory,
                        "*.dll",
                        SearchOption.TopDirectoryOnly).FirstOrDefault();
                    if (firstAssembly != null)
                    {
                        return firstAssembly;
                    }
                }
            }
            return null;
        }

        /// <summary>
        /// Resolves a stable version of <paramref name="packageName"/> from the configured NuGet feeds
        /// using the project's version specification when provided.
        /// </summary>
        public static async Task<string?> ResolvePackageVersion(
            string packageName,
            ISettings nugetSettings,
            string? packageVersionSpec)
        {
            VersionRange? versionRange = null;
            if (!string.IsNullOrEmpty(packageVersionSpec))
            {
                VersionRange.TryParse(packageVersionSpec, out versionRange);
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
                    var allowPrerelease = versionRange?.MinVersion?.IsPrerelease == true
                        || versionRange?.MaxVersion?.IsPrerelease == true
                        || versionRange?.Float?.IncludePrerelease == true;
                    var matchingVersions = versions?
                        .Where(v => (!v.IsPrerelease || allowPrerelease) && IsVersionMatch(versionRange, v));
                    var latest = versionRange?.Float != null
                        ? matchingVersions?.OrderByDescending(v => v).FirstOrDefault()
                        : versionRange != null
                            ? matchingVersions?.OrderBy(v => v).FirstOrDefault()
                            : matchingVersions?.OrderByDescending(v => v).FirstOrDefault();
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

        private static bool IsVersionMatch(VersionRange? versionRange, NuGetVersion version) =>
            versionRange == null
            || (versionRange.Satisfies(version)
                && (versionRange.Float?.Satisfies(version) ?? true));
    }
}
