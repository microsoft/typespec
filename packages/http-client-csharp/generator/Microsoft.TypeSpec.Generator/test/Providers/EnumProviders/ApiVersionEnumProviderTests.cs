// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using System.Threading.Tasks;
using Moq;
using Moq.Protected;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.EnumProviders
{
    public class ApiVersionEnumProviderTests
    {
        [Test]
        public async Task BackCompat_PrereleaseApiVersionsAdded()
        {
            string[] apiVersions = ["1.0.0"];
            var input = InputFactory.Int32Enum(
                "mockInputEnum",
                apiVersions.Select((a, index) => (a, index)),
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var mockDeclaringType = new Mock<TypeProvider>();
            mockDeclaringType.Protected().Setup<string>("BuildName").Returns("SampleNamespaceClientOptions");
            mockDeclaringType.Protected().Setup<string>("BuildNamespace").Returns("SampleNamespace");
            var enumType = EnumProvider.Create(input, mockDeclaringType.Object);
            Assert.IsTrue(enumType is ApiVersionEnumProvider);

            var provider = (ApiVersionEnumProvider)enumType;
            Assert.IsNotNull(provider);
            Assert.That(provider.Name, Is.EqualTo("ServiceVersion"));
            Assert.That(provider.EnumValues.Count, Is.EqualTo(3));
            Assert.That(provider.EnumValues.Select(v => v.Name), Is.EquivalentTo(new[] { "V1_0_0", "V2023_10_01_Beta", "V2023_11_01_Beta" }));
        }

        [Test]
        public async Task BackCompat_GAApiVersionsAdded()
        {
            string[] apiVersions = ["2.0.0", "3.0.0"];
            var input = InputFactory.Int32Enum(
                "mockInputEnum",
                apiVersions.Select((a, index) => (a, index)),
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var mockDeclaringType = new Mock<TypeProvider>();
            mockDeclaringType.Protected().Setup<string>("BuildName").Returns("SampleNamespaceClientOptions");
            mockDeclaringType.Protected().Setup<string>("BuildNamespace").Returns("SampleNamespace");
            var enumType = EnumProvider.Create(input, mockDeclaringType.Object);
            Assert.IsTrue(enumType is ApiVersionEnumProvider);

            var provider = (ApiVersionEnumProvider)enumType;
            Assert.IsNotNull(provider);
            Assert.That(provider.Name, Is.EqualTo("ServiceVersion"));
            Assert.That(provider.EnumValues.Count, Is.EqualTo(3));
            Assert.That(provider.EnumValues.Select(v => v.Name), Is.EquivalentTo(new[] { "V1_0_0", "V2_0_0", "V3_0_0" }));
        }
    }
}
