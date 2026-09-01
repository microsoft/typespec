// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NuGet.Configuration;
using NuGet.Frameworks;
using NuGet.Protocol;
using NuGet.Protocol.Core.Types;
using NuGet.Repositories;
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

        /// <summary>
        /// Searches for an assembly belonging to <paramref name="packageName"/> in one specific installed
        /// version of the package. Unlike <see cref="FindPackageAssembly"/> this performs no version
        /// selection, so callers that already know the exact version (e.g. from a resolved dependency
        /// closure) cannot accidentally bind to a different one.
        /// </summary>
        public static string? FindPackageAssemblyInVersion(string globalPackagesFolder, string packageName, string version)
        {
            if (!NuGetVersion.TryParse(version, out var parsedVersion)
                || !TryFindPackageInCache(globalPackagesFolder, packageName, parsedVersion, out var packageInfo))
            {
                return null;
            }

            return TryFindNearestAssemblyInVersionDir(packageInfo.ExpandedPath, packageName);
        }

        /// <summary>
        /// Uses NuGet's local repository implementation to locate one exact package version in the global
        /// packages folder.
        /// </summary>
        public static bool TryFindPackageInCache(
            string globalPackagesFolder,
            string packageName,
            NuGetVersion version,
            [NotNullWhen(true)] out NuGet.Repositories.LocalPackageInfo? packageInfo)
        {
            // cspell: disable-next-line
            var localRepository = new NuGetv3LocalRepository(globalPackagesFolder);
            packageInfo = localRepository.FindPackage(packageName, version);
            return packageInfo != null;
        }

        /// <summary>
        /// Picks the <c>lib/</c> asset closest to the framework the generator is running on, the same way NuGet
        /// would for a project targeting that framework.
        /// </summary>
        /// <remarks>
        /// This differs from <see cref="TryFindAssemblyInVersionDir"/>, which probes
        /// <see cref="NugetPackageDownloader.PreferredDotNetFrameworkVersions"/> and therefore prefers
        /// <c>netstandard2.0</c>. That ordering is fine for collecting compile-time references, but assemblies
        /// resolved here are loaded into the running generator, where a <c>netstandard2.0</c> asset can bind
        /// against compatibility shims that duplicate types the shared framework already provides.
        /// </remarks>
        private static string? TryFindNearestAssemblyInVersionDir(string versionDir, string packageName)
        {
            var libDir = Path.Combine(versionDir, "lib");
            if (!Directory.Exists(libDir))
            {
                return null;
            }

            var candidates = Directory.GetDirectories(libDir)
                .Select(dir => (Dir: dir, Framework: ParseFrameworkFolder(Path.GetFileName(dir))))
                .Where(c => c.Framework != null && File.Exists(Path.Combine(c.Dir, $"{packageName}.dll")))
                .ToList();

            if (candidates.Count == 0)
            {
                return null;
            }

            var nearest = new FrameworkReducer().GetNearest(CurrentFramework, candidates.Select(c => c.Framework!));
            var match = nearest != null
                ? candidates.First(c => c.Framework!.Equals(nearest))
                : candidates[0];

            return Path.Combine(match.Dir, $"{packageName}.dll");
        }

        private static NuGetFramework? ParseFrameworkFolder(string folderName)
        {
            try
            {
                var framework = NuGetFramework.ParseFolder(folderName);
                return framework.IsUnsupported ? null : framework;
            }
            catch (ArgumentException)
            {
                return null;
            }
        }

        /// <summary>
        /// The framework the generator itself is running on, used to choose <c>lib/</c> assets that are safe to
        /// load into this process.
        /// </summary>
        internal static NuGetFramework CurrentFramework { get; } = ResolveCurrentFramework();

        private static NuGetFramework ResolveCurrentFramework()
        {
            var frameworkName = AppContext.TargetFrameworkName;
            if (!string.IsNullOrEmpty(frameworkName))
            {
                try
                {
                    return NuGetFramework.Parse(frameworkName);
                }
                catch (ArgumentException)
                {
                    // Fall through to the runtime-version based approximation below.
                }
            }

            return NuGetFramework.Parse($".NETCoreApp,Version=v{Environment.Version.Major}.{Environment.Version.Minor}");
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
