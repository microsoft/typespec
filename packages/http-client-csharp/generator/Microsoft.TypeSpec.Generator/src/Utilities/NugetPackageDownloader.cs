// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NuGet.Common;
using NuGet.Configuration;
using NuGet.Versioning;
using System;
using System.Net.Http;
using System.Net;
using System.Threading.Tasks;
using System.Threading;
using NuGet.Protocol.Core.Types;
using System.Collections.Generic;
using System.Linq;
using NuGet.Protocol;
using NuGet.Packaging.Core;
using NuGet.Packaging.Signing;
using NuGet.Packaging;
using System.IO;
using System.Diagnostics.CodeAnalysis;
using NuGet.Repositories;
using ILogger = NuGet.Common.ILogger;
using PackageArchiveDownloader = NuGet.Protocol.LocalPackageArchiveDownloader;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal class NugetPackageDownloader
    {
        private readonly string _packageName;
        private readonly string _packageVersion;
        private readonly string _globalNugetPackagePath;
        private readonly ISettings _nugetSettings;
        private readonly IReadOnlyList<PackageSource> _availableSources;
        private readonly HashSet<string> _targetFrameworks;
        // cspell: disable-next-line
        private readonly NuGetv3LocalRepository _localRepo;

        public NugetPackageDownloader(
            string packageName,
            string packageVersion,
            IEnumerable<string>? targetFrameworks,
            ISettings settings)
        {
            _nugetSettings = settings;
            _targetFrameworks = targetFrameworks is null
                ? [ ..PreferredDotNetFrameworkVersions ]
                : [.. targetFrameworks];
            _availableSources = GetPrimaryPackageSources(settings);
            _globalNugetPackagePath = SettingsUtility.GetGlobalPackagesFolder(settings);
            // cspell: disable-next-line
            _localRepo = new NuGetv3LocalRepository(_globalNugetPackagePath);
            _packageName = packageName;
            _packageVersion = packageVersion;
        }

        protected virtual SourceRepository GetCoreV3NugetSourceRepo(string source)
        {
            return Repository.Factory.GetCoreV3(source);
        }

        protected virtual async Task<bool> PackageExistsInSource(
            MetadataResource resource,
            string packageName,
            NuGetVersion packageVersion,
            SourceCacheContext cacheContext,
            ILogger logger,
            CancellationToken cancellationToken)
        {
            return await resource.Exists(new PackageIdentity(packageName, packageVersion), cacheContext, logger, cancellationToken);
        }

        protected virtual bool TryFindPackageInCache(string packageName, NuGetVersion version, out NuGet.Repositories.LocalPackageInfo? packageInfo)
        {
            packageInfo = _localRepo.FindPackage(packageName, version);
            return packageInfo != null;
        }

        protected virtual bool DirectoryExists(string path)
        {
            return Directory.Exists(path);
        }

        public async Task<string> DownloadAndInstallPackage()
        {
            var parsedVersion = ParseVersionString(_packageVersion);
            var resource = await FindPackageInSources(parsedVersion);

            return await InstallPackageAndGetPath(resource);
        }

        internal static readonly List<string> PreferredDotNetFrameworkVersions =
        [
             "netstandard2.0",
             "netstandard2.1",
             "net9.0",
             "net8.0",
             "net7.0",
             "net6.0",
             "net5.0",
        ];

        private async Task<NugetPackageResource> FindPackageInSources(NuGetVersion packageVersion)
        {
            CancellationToken cancellationToken = CancellationToken.None;
            using (var cacheContext = new SourceCacheContext())
            {
                foreach (var source in _availableSources)
                {
                    try
                    {
                        var feedUrl = source.Source;
                        var repository = GetCoreV3NugetSourceRepo(feedUrl);
                        MetadataResource resource = await repository.GetResourceAsync<MetadataResource>(cancellationToken);
                        bool exists = await PackageExistsInSource(resource, _packageName, packageVersion, cacheContext, NullLogger.Instance, cancellationToken);

                        if (exists)
                        {
                            return new NugetPackageResource(_packageName, feedUrl, source.IsLocal, packageVersion);
                        }
                    }
                    catch (FatalProtocolException ex) when
                            (ex.InnerException is HttpRequestException httpEx && httpEx.StatusCode == HttpStatusCode.Unauthorized)
                    {
                        CodeModelGenerator.Instance.Emitter.Debug($"Unauthorized access to source {source.Name}. Skipping..");
                    }
                }
            }

            var searchedSources = string.Join(", ", _availableSources.Select(s => s.Source));
            throw new InvalidOperationException($"Failed to find package {_packageName}.{_packageVersion} in any of the searched sources: {searchedSources}");
        }

        private async Task<string> InstallPackageAndGetPath(NugetPackageResource packageResource)
        {
            string packageName = packageResource.Name;
            string source = packageResource.FeedUrl;
            NuGetVersion? version = packageResource.Version;
            bool isLocalFeed = packageResource.IsLocalFeed;

            if (version == null)
            {
                throw new InvalidOperationException($"A valid version if required to download and install a package.");
            }

            await InstallPackage(packageName, version, source, isLocalFeed);
            if (!TryFindPackageLibPathInCache(packageName, version, out string? nugetPackagePathInCache))
            {
                throw new InvalidOperationException($"Failed to find package {packageName} in cache after installation.");
            }

            return nugetPackagePathInCache!;
        }

        private async Task InstallPackage(string packageName, NuGetVersion version, string sourceFeedUrl, bool isLocalFeed)
        {
            var packageIdentity = new PackageIdentity(packageName, version);
            CodeModelGenerator.Instance.Emitter.Debug($"Installing package {packageName}.{version} from source {sourceFeedUrl}.");

            try
            {
                if (isLocalFeed)
                {
                    await InstallLocalPackage(sourceFeedUrl, packageIdentity);
                }
                else
                {
                    await InstallPackageFromSource(sourceFeedUrl, packageIdentity);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to install package {packageName} from source {sourceFeedUrl}.", ex);
            }
        }

        private async Task InstallLocalPackage(string sourceFeedUrl, PackageIdentity packageIdentity)
        {
            var packageExtractionContext = new PackageExtractionContext(
                // cspell: disable-next-line
                PackageSaveMode.Defaultv3,
                XmlDocFileSaveMode.None,
                ClientPolicyContext.GetClientPolicy(_nugetSettings, NullLogger.Instance),
                NullLogger.Instance);

            var packageSourceResolver = new VersionFolderPathResolver(sourceFeedUrl);
            var sourceNugetFileName = packageSourceResolver.GetPackageFileName(packageIdentity.Id, packageIdentity.Version);
            var sourceNugetFilePath = Path.Combine(packageSourceResolver.RootPath, sourceNugetFileName);

            using var packageDownloader = new PackageArchiveDownloader(
                source: sourceFeedUrl,
                packageFilePath: sourceNugetFilePath,
                packageIdentity: packageIdentity,
                logger: NullLogger.Instance);

            await PackageExtractor.InstallFromSourceAsync(
                packageIdentity,
                packageDownloader,
                new VersionFolderPathResolver(_globalNugetPackagePath),
                packageExtractionContext,
                CancellationToken.None);
        }

        private async Task InstallPackageFromSource(string sourceFeedUrl, PackageIdentity packageIdentity)
        {
            SourceRepository repository = GetCoreV3NugetSourceRepo(sourceFeedUrl);
            DownloadResource downloadResource = await repository.GetResourceAsync<DownloadResource>();

            using (var cacheContext = new SourceCacheContext())
            {
                using var downloadResult = await downloadResource.GetDownloadResourceResultAsync(
                    packageIdentity,
                    new PackageDownloadContext(cacheContext),
                    _globalNugetPackagePath,
                    NullLogger.Instance,
                    CancellationToken.None);

                if (downloadResult?.Status != DownloadResourceResultStatus.Available)
                {
                    throw new InvalidOperationException($"Failed to download and install package {packageIdentity.Id} with version {packageIdentity.Version}");
                }
            }
        }

        private bool TryFindPackageLibPathInCache(string packageName, NuGetVersion packageVersion, [MaybeNullWhen(false)] out string? path)
        {
            path = null;
            if (TryFindPackageInCache(packageName, packageVersion, out NuGet.Repositories.LocalPackageInfo? existingPackage))
            {
                path = GetPackageLibraryPath(existingPackage?.ExpandedPath);
                return path != null;
            }

            return false;
        }

        private string? GetPackageLibraryPath(string? packageVersionPath)
        {
            if (packageVersionPath == null)
            {
                return null;
            }

            string packageLibraryPath = Path.Combine(packageVersionPath, "lib");
            if (!DirectoryExists(packageLibraryPath))
            {
                return null;
            }

            return GetDotNetFolderPath(packageLibraryPath);
        }

        private string? GetDotNetFolderPath(string packageLibraryPath)
        {
            foreach (var preferredDotNetFrameworkVersion in PreferredDotNetFrameworkVersions)
            {
                if (!_targetFrameworks.Contains(preferredDotNetFrameworkVersion))
                {
                    continue;
                }

                var dotNetFolder = Path.Combine(packageLibraryPath, preferredDotNetFrameworkVersion);
                if (DirectoryExists(dotNetFolder))
                {
                    return dotNetFolder;
                }
            }

            return null;
        }

        private static List<PackageSource> GetPrimaryPackageSources(ISettings settings)
        {
            return [.. new PackageSourceProvider(settings)
                .LoadPackageSources()
                .Where(source => source.IsEnabled)];
        }

        internal static NuGetVersion ParseVersionString(string version)
        {
            NuGetVersion parsedVersion;
            try
            {
                parsedVersion = NuGetVersion.Parse(version);
            }
            catch (Exception ex)
            {
                throw new ArgumentException($"Failed to parse version string {version}.", nameof(version), ex);
            }

            return parsedVersion;
        }

        internal readonly struct NugetPackageResource
        {
            /// <summary>
            /// The name of the nuget package.
            /// </summary>
            public string Name { get; }
            /// <summary>
            /// The source feed URL of the nuget package where it was downloaded from.
            /// </summary>
            public string FeedUrl { get; }
            /// <summary>
            /// The <see cref="NuGetVersion"/> of the package, if any.
            /// </summary>
            public NuGetVersion? Version { get; }
            /// <summary>
            /// Flag to determine if <see cref="FeedUrl"/> pertains to a local source feed URL.
            /// </summary>
            public bool IsLocalFeed { get; }

            public NugetPackageResource() : this(string.Empty, string.Empty, false, null) { }

            /// <summary>
            /// Constructs a new instance of <see cref="NugetPackageResource"/> with the specified package name, feed URL, and version.
            /// </summary>
            /// <param name="packageName">The package name.</param>
            /// <param name="feedUrl">The source feed of where to download the package from.</param>
            /// <param name="isLocalFeed"><c>true</c>, if <paramref name="feedUrl"/> pertains to a local feed.</param>
            /// <param name="version">The version of the package.</param>
            public NugetPackageResource(string packageName, string feedUrl, bool isLocalFeed, NuGetVersion? version)
            {
                Name = packageName;
                FeedUrl = feedUrl;
                IsLocalFeed = isLocalFeed;
                Version = version;
            }
        }
    }
}
