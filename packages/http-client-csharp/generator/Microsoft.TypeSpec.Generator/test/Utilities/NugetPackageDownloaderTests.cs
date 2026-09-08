// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using Microsoft.TypeSpec.Generator.Utilities;
using Moq;
using NuGet.Common;
using NuGet.Configuration;
using NuGet.Frameworks;
using NuGet.Packaging;
using NuGet.Packaging.Core;
using NuGet.Protocol.Core.Types;
using NuGet.Repositories;
using NuGet.RuntimeModel;
using NuGet.Versioning;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class NugetPackageDownloaderTests
    {
        private Mock<ISettings>? _mockSettings;

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
            _mockSettings = new Mock<ISettings>();
            _mockSettings.Setup(s => s.GetSection(It.IsAny<string>())).Returns(It.IsAny<SettingSection>());
        }

        [TestCase("1.0.0")]
        [TestCase("invalid")]
        public void DownloadAndInstallPackage_HostedModeRejectsBeforeAccessingSources(string version)
        {
            CodeModelGenerator.Instance.IsHosted = true;
            var repository = new Mock<SourceRepository>(MockBehavior.Strict);
            var settings = new TestNugetSettings
            {
                Sections =
                [
                    new TestNugetSettingSection(ConfigurationConstants.PackageSources, new SourceItem("mockSource", "mockSourceUri"))
                ]
            };
            var downloader = new TestNugetPackageDownloader("Mock.Package", version, settings, repository.Object);

            var exception = Assert.ThrowsAsync<InvalidOperationException>(downloader.DownloadAndInstallPackage);

            Assert.AreEqual("NuGet package downloads are disabled in hosted mode.", exception!.Message);
            repository.VerifyNoOtherCalls();
        }

        [TestCase(null)]
        [TestCase("1.0.0")]
        public void ResolveLatestPackageVersion_HostedModeRejectsBeforeAccessingSources(string? minVersion)
        {
            CodeModelGenerator.Instance.IsHosted = true;
            var settings = new Mock<ISettings>(MockBehavior.Strict);

            var exception = Assert.ThrowsAsync<InvalidOperationException>(() =>
                NugetPackageResolver.ResolveLatestPackageVersion("Mock.Package", settings.Object, minVersion));

            Assert.AreEqual("NuGet package downloads are disabled in hosted mode.", exception!.Message);
            settings.VerifyNoOtherCalls();
        }

        [Test]
        public async Task ResolveLatestPackageVersion_LocalModeCanReadSources()
        {
            var settings = new TestNugetSettings
            {
                Sections =
                [
                    new TestNugetSettingSection(ConfigurationConstants.PackageSources)
                ]
            };

            var version = await NugetPackageResolver.ResolveLatestPackageVersion("Mock.Package", settings);

            Assert.IsNull(version);
        }

        [TestCaseSource("ParseVersionStringTestCases")]
        public void TestParseVersionString(string version, string? expectedStringVersion, NuGetVersion? expectedVersion, bool throwsError)
        {
            if (throwsError)
            {
                Assert.Throws<ArgumentException>(() =>  NugetPackageDownloader.ParseVersionString(version));
            }
            else
            {
                var result = NugetPackageDownloader.ParseVersionString(version);
                Assert.IsNotNull(result);
                Assert.AreEqual(expectedVersion, result);
                Assert.AreEqual(expectedStringVersion, result.ToString());
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task TestDownloadAndInstallPackage(bool packageExistsInSource)
        {
            var packageName = "mockPackage";
            var packageVersion = "1.0.0";
            var mockDownloadResource = new Mock<DownloadResource>();

            mockDownloadResource.Setup(d => d.GetDownloadResourceResultAsync(
                It.IsAny<PackageIdentity>(),
                It.IsAny<PackageDownloadContext>(),
                It.IsAny<string>(),
                It.IsAny<ILogger>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.FromResult(new DownloadResourceResult(new Mock<Stream>().Object, "mockSource")));
            var mockPackageSourceRepository = new Mock<SourceRepository>();
            mockPackageSourceRepository.SetupSequence(s => s.GetResourceAsync<DownloadResource>())
                .Returns(Task.FromResult(mockDownloadResource.Object));
            TestNugetSettings mockSettings = new()
            {
                Sections =
                [
                    new TestNugetSettingSection(ConfigurationConstants.PackageSources, new SourceItem("mockSource", "mockSourceUri"))
                ]
            };

            var mockLocalPackageInfo = new LocalPackageInfo(packageName, NuGetVersion.Parse(packageVersion), packageName, "mockSourceUri", "mockManifestPath",
                "mockSha512Path", new Lazy<NuspecReader>(), new Lazy<IReadOnlyList<string>>(), new Lazy<string>(),
                new Lazy<RuntimeGraph>());
            var mockFileInfos = new FileInfo[] { new("c:\\mockPath\\someDll.dll") };
            var downloader = new TestNugetPackageDownloader(
                packageName,
                packageVersion,
                mockSettings,
                mockPackageSourceRepository.Object,
                true,
                packageExistsInSource,
                null,
                mockLocalPackageInfo);

            Assert.NotNull(downloader);

            if (packageExistsInSource)
            {
                var result = await downloader.DownloadAndInstallPackage();
                Assert.NotNull(result);
            }
            else
            {
                Assert.ThrowsAsync<InvalidOperationException>(downloader.DownloadAndInstallPackage);
            }
        }

        // This test validates that when target frameworks don't match any existing directory,
        // it falls back to the first available preferred version
        [Test]
        public async Task TestGetDotNetFolderPathFallback()
        {
            var packageName = "mockPackage";
            var packageVersion = "1.0.0";
            var mockDownloadResource = new Mock<DownloadResource>();

            mockDownloadResource.Setup(d => d.GetDownloadResourceResultAsync(
                It.IsAny<PackageIdentity>(),
                It.IsAny<PackageDownloadContext>(),
                It.IsAny<string>(),
                It.IsAny<ILogger>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.FromResult(new DownloadResourceResult(new Mock<Stream>().Object, "mockSource")));
            
            var mockPackageSourceRepository = new Mock<SourceRepository>();
            mockPackageSourceRepository.Setup(s => s.GetResourceAsync<DownloadResource>())
                .Returns(Task.FromResult(mockDownloadResource.Object));
            
            TestNugetSettings mockSettings = new()
            {
                Sections =
                [
                    new TestNugetSettingSection(ConfigurationConstants.PackageSources, new SourceItem("mockSource", "mockSourceUri"))
                ]
            };

            // Set up: target framework is "net9.0" but only "netstandard2.0" directory exists
            var packagePath = "c:\\mockPath";
            var libPath = Path.Combine(packagePath, "lib");
            var existingDirs = new HashSet<string>
            {
                libPath,
                Path.Combine(libPath, "netstandard2.0")
            };

            var mockLocalPackageInfo = new LocalPackageInfo(
                packageName,
                NuGetVersion.Parse(packageVersion),
                packagePath,
                "mockSourceUri",
                "mockManifestPath",
                "mockSha512Path",
                new Lazy<NuspecReader>(),
                new Lazy<IReadOnlyList<string>>(),
                new Lazy<string>(),
                new Lazy<RuntimeGraph>());

            var downloader = new TestNugetPackageDownloader(
                packageName,
                packageVersion,
                mockSettings,
                mockPackageSourceRepository.Object,
                true,
                true,
                ["net9.0"],
                mockLocalPackageInfo,
                existingDirs);

            var result = await downloader.DownloadAndInstallPackage();
            
            Assert.NotNull(result);
            Assert.AreEqual(Path.Combine(libPath, "netstandard2.0"), result);
        }

        public static IEnumerable<TestCaseData> ParseVersionStringTestCases
        {
            get
            {
                yield return new TestCaseData("1.0.0", "1.0.0", NuGetVersion.Parse("1.0.0"), false);
                yield return new TestCaseData("1.0.0-beta.1", "1.0.0-beta.1", NuGetVersion.Parse("1.0.0-beta.1"), false);
                yield return new TestCaseData("1.0.0.0-beta.1", "1.0.0-beta.1", NuGetVersion.Parse("1.0.0-beta.1"), false);
                yield return new TestCaseData("invalid", null, null, true);
            }
        }
    }
}
