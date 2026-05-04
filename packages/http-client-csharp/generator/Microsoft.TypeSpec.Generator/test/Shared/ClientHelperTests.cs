// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Shared;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Shared
{
    public class ClientHelperTests
    {
        [Test]
        public void BuildNameForService_NoPrefixNoSuffix_AddsBoth()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_HasPrefixNoSuffix_AddsSuffix()
        {
            var result = ClientHelper.BuildNameForService("Sample.ServiceKeyVault", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_NoPrefixHasSuffix_AddsPrefix()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVaultVersion", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_HasPrefixAndSuffix_ReturnsAsIs()
        {
            var result = ClientHelper.BuildNameForService("Sample.ServiceKeyVaultVersion", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultVersion", result);
        }

        // Namespace handling tests

        [Test]
        public void BuildNameForService_MultipleNamespaceSegments_ExtractsLastSegment()
        {
            var result = ClientHelper.BuildNameForService("Azure.ResourceManager.Storage", "Service", "Version");
            Assert.AreEqual("ServiceStorageVersion", result);
        }

        [Test]
        public void BuildNameForService_NoNamespaceSegments_UsesFullName()
        {
            var result = ClientHelper.BuildNameForService("Storage", "Service", "Version");
            Assert.AreEqual("ServiceStorageVersion", result);
        }

        [Test]
        public void BuildNameForService_SingleDotNamespace_ExtractsLastSegment()
        {
            var result = ClientHelper.BuildNameForService("Sample.Compute", "Service", "Version");
            Assert.AreEqual("ServiceComputeVersion", result);
        }

        // Case insensitivity tests

        [Test]
        public void BuildNameForService_PrefixCaseInsensitive_LowerCase()
        {
            var result = ClientHelper.BuildNameForService("Sample.serviceKeyVault", "Service", "Version");
            Assert.AreEqual("serviceKeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_SuffixCaseInsensitive_LowerCase()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVaultversion", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultversion", result);
        }

        [Test]
        public void BuildNameForService_BothCaseInsensitive_MixedCase()
        {
            var result = ClientHelper.BuildNameForService("Sample.SERVICEKeyVaultVERSION", "Service", "Version");
            Assert.AreEqual("SERVICEKeyVaultVERSION", result);
        }

        // Edge cases

        [Test]
        public void BuildNameForService_EmptyServiceName_ReturnsEmptyWithPrefixAndSuffix()
        {
            var result = ClientHelper.BuildNameForService("", "Service", "Version");
            Assert.AreEqual("ServiceVersion", result);
        }

        [Test]
        public void BuildNameForService_TrailingDot_ReturnsEmptyWithPrefixAndSuffix()
        {
            var result = ClientHelper.BuildNameForService("Sample.", "Service", "Version");
            Assert.AreEqual("ServiceVersion", result);
        }

        [Test]
        public void BuildNameForService_EmptyPrefix_OnlyAddsSuffix()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "", "Version");
            Assert.AreEqual("KeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_EmptySuffix_OnlyAddsPrefix()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "Service", "");
            Assert.AreEqual("ServiceKeyVault", result);
        }

        [Test]
        public void BuildNameForService_BothPrefixAndSuffixEmpty_ReturnsLastSegment()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "", "");
            Assert.AreEqual("KeyVault", result);
        }

        [Test]
        public void BuildNameForService_ServiceNameEqualsPrefix_AddsSuffix()
        {
            var result = ClientHelper.BuildNameForService("Sample.Service", "Service", "Version");
            Assert.AreEqual("ServiceVersion", result);
        }

        [Test]
        public void BuildNameForService_ServiceNameEqualsSuffix_AddsPrefix()
        {
            var result = ClientHelper.BuildNameForService("Sample.Version", "Service", "Version");
            Assert.AreEqual("ServiceVersion", result);
        }

        [Test]
        public void BuildNameForService_ServiceNameEqualsPrefixAndSuffix_ReturnsAsIs()
        {
            var result = ClientHelper.BuildNameForService("Sample.ServiceVersion", "Service", "Version");
            Assert.AreEqual("ServiceVersion", result);
        }

        [Test]
        public void BuildNameForService_AzureKeyVault_GeneratesCorrectName()
        {
            var result = ClientHelper.BuildNameForService("Azure.Security.KeyVault", "Service", "Version");
            Assert.AreEqual("ServiceKeyVaultVersion", result);
        }

        [Test]
        public void BuildNameForService_AzureStorage_GeneratesCorrectName()
        {
            var result = ClientHelper.BuildNameForService("Azure.Storage.Blobs", "Service", "Version");
            Assert.AreEqual("ServiceBlobsVersion", result);
        }

        [Test]
        public void BuildNameForService_ApiVersionSuffix_GeneratesCorrectName()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "Service", "ApiVersion");
            Assert.AreEqual("ServiceKeyVaultApiVersion", result);
        }

        [Test]
        public void BuildNameForService_LatestPrefix_GeneratesCorrectName()
        {
            var result = ClientHelper.BuildNameForService("Sample.KeyVault", "Latest", "Version");
            Assert.AreEqual("LatestKeyVaultVersion", result);
        }
    }
}
