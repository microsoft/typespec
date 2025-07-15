// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.TypeSpec.Generator.Utilities;
using Moq;
using NuGet.Configuration;
using NuGet.Frameworks;
using NuGet.Packaging.Core;
using NuGet.Protocol.Core.Types;
using NuGet.Versioning;
using NUnit.Framework;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NuGet.Common;
using System.IO;
using NuGet.Repositories;
using NuGet.Packaging;
using NuGet.RuntimeModel;

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
