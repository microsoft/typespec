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
using Microsoft.TypeSpec.Generator.Expressions;

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
            Assert.IsTrue(provider.EnumValues.Select(v => v.Name).SequenceEqual(["V1_0_0", "V2023_10_01_Beta", "V2023_11_01_Beta"]));
        }

        [Test]
        public async Task BackCompat_PrereleaseAndGAApiVersionsAdded()
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
            Assert.That(provider.EnumValues.Count, Is.EqualTo(6));
            Assert.IsTrue(provider.EnumValues.Select(v => v.Name).SequenceEqual(["V1_0_0", "V2023_10_01_Beta_1", "V2023_10_01_Beta_2", "V2023_11_01", "V2024_01_01_Beta", "V2024_01_01"]));
        }

        [Test]
        public async Task BackCompat_PreviewAndGAApiVersionsAdded()
        {
            string[] apiVersions = ["1.0.0", "V2023_10_01_Preview_2"];
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
            Assert.That(provider.EnumValues.Count, Is.EqualTo(6));
            Assert.IsTrue(provider.EnumValues.Select(v => v.Name).SequenceEqual(["V1_0_0", "V2023_10_01_Preview_1", "V2023_10_01_Preview_2", "V2023_11_01", "V2024_01_01_Preview", "V2024_01_01"]));
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
            Assert.IsTrue(provider.EnumValues.Select(v => v.Name).SequenceEqual(["V1_0_0", "V2_0_0", "V3_0_0"]));
        }

        [Test]
        public async Task CustomEnumMembers()
        {
            string[] apiVersions = ["2.0.0", "3.0.0"];
            var input = InputFactory.Int32Enum(
                "mockInputEnum",
                apiVersions.Select((a, index) => (a, index)),
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "SampleNamespace");
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var mockDeclaringType = new Mock<TypeProvider>();
            mockDeclaringType.Protected().Setup<string>("BuildName").Returns("SampleNamespaceClientOptions");
            mockDeclaringType.Protected().Setup<string>("BuildNamespace").Returns("SampleNamespace");
            var enumType = EnumProvider.Create(input, mockDeclaringType.Object);
            Assert.IsTrue(enumType is ApiVersionEnumProvider);

            var provider = (ApiVersionEnumProvider)enumType;
            Assert.IsNotNull(provider);
            Assert.That(provider.Name, Is.EqualTo("ServiceVersion"));
            Assert.That(provider.EnumValues.Count, Is.EqualTo(3));
            Assert.AreEqual("V2023_10_01_Preview_1", provider.EnumValues[0].Name);
            Assert.AreEqual(new LiteralExpression(0), provider.EnumValues[0].Value);
            Assert.AreEqual("V2023_11_01", provider.EnumValues[1].Name);
            Assert.AreEqual(new LiteralExpression(1), provider.EnumValues[1].Value);
            Assert.AreEqual("V2024_01_01", provider.EnumValues[2].Name);
            Assert.AreEqual(new LiteralExpression(2), provider.EnumValues[2].Value);
        }
    }
}
