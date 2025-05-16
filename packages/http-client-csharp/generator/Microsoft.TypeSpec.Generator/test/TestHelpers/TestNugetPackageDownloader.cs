// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Utilities;
using NuGet.Common;
using NuGet.Configuration;
using NuGet.Protocol.Core.Types;
using NuGet.Repositories;
using NuGet.Versioning;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    internal class TestNugetPackageDownloader : NugetPackageDownloader
    {
        private const string DefaultTargetFramework = "netstandard2.0";
        private readonly SourceRepository _mockPackageSourceRepo;
        private readonly bool _mockDirectoryExists;
        private readonly bool _mockTryFindPackageInCache;
        private readonly bool _mockPackageExistsInSource;
        private readonly LocalPackageInfo? _mockLocalPackageInfo;

        public TestNugetPackageDownloader(
            string packageName,
            string version,
            ISettings settings,
            SourceRepository sourceRepository) : this(packageName, version, settings, sourceRepository, false, false)
        {
        }

        public TestNugetPackageDownloader(
            string packageName,
            string version,
            ISettings settings,
            SourceRepository sourceRepository,
            bool directoryExists,
            bool packageExistsInSource,
            IEnumerable<string>? targetFrameworks = null,
            LocalPackageInfo? localPackageInfo = null) : base(packageName, version, targetFrameworks ?? [DefaultTargetFramework], settings)
        {
            _mockPackageSourceRepo = sourceRepository;
            _mockDirectoryExists = directoryExists;
            _mockLocalPackageInfo = localPackageInfo;
            _mockTryFindPackageInCache = _mockLocalPackageInfo != null;
            _mockPackageExistsInSource = packageExistsInSource;
        }

        protected override SourceRepository GetCoreV3NugetSourceRepo(string source)
        {
            return _mockPackageSourceRepo;
        }

        protected override bool DirectoryExists(string path)
        {
            return _mockDirectoryExists;
        }

        protected override Task<bool> PackageExistsInSource(
            MetadataResource resource,
            string packageName,
            NuGetVersion packageVersion,
            SourceCacheContext cacheContext,
            ILogger logger,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(_mockPackageExistsInSource);
        }

        protected override bool TryFindPackageInCache(string packageName, NuGetVersion version, out NuGet.Repositories.LocalPackageInfo? localPackageInfo)
        {
            localPackageInfo = _mockLocalPackageInfo;
            return _mockTryFindPackageInCache;
        }
    }
}
