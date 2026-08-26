// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.

using System.ClientModel;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ModelFactoryProviders
{
    public class ScmModelFactoryProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestFactory_MultipartFormDataOnly_CarriesExperimentalAttribute()
        {
            var fileRequest = MultipartModel(
                "FileRequest",
                [FilePartProperty("profileImage")]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_MixedJsonAndMultipartUsage_CarriesExperimentalAttribute()
        {
            var mixed = MultipartModel(
                "DualUsageRequest",
                [FilePartProperty("profileImage")],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [mixed]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([mixed]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_NonMultipartModel_DoesNotCarryExperimentalAttribute()
        {
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([regular]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_MultipartAndRegularModels_Combined()
        {
            var fileRequest = MultipartModel(
                "FileRequest",
                [FilePartProperty("profileImage")]);
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest, regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest, regular]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_ExperimentalAttribute_OnlyAppliedToMethodsWithFileBinaryContentParameter()
        {
            var fileRequest = InputFactory.Model(
                "FileRequest",
                properties: [InputFactory.Property("profileImage", InputFactory.FileType(), isRequired: true)]);
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest, regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest, regular]);

            var fileRequestMethod = factory.Methods.Single(m => m.Signature.Name == "FileRequest");
            var regularMethod = factory.Methods.Single(m => m.Signature.Name == "RegularModel");

            Assert.IsTrue(
                fileRequestMethod.Signature.Parameters.Any(p => p.Type.FrameworkType == typeof(FileBinaryContent)),
                "FileRequest factory method should contain a FileBinaryContent parameter.");
            Assert.IsTrue(
                fileRequestMethod.Signature.Attributes.Any(a => a.Type.FrameworkType == typeof(ExperimentalAttribute)),
                "FileRequest factory method should carry the ExperimentalAttribute because it has a FileBinaryContent parameter.");

            Assert.IsFalse(
                regularMethod.Signature.Parameters.Any(p => p.Type.FrameworkType == typeof(FileBinaryContent)),
                "RegularModel factory method should not contain a FileBinaryContent parameter.");
            Assert.IsFalse(
                regularMethod.Signature.Attributes.Any(a => a.Type.FrameworkType == typeof(ExperimentalAttribute)),
                "RegularModel factory method should not carry the ExperimentalAttribute because it has no FileBinaryContent parameter.");
        }

        private static InputModelProperty FilePartProperty(string name)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true)));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);

    }
}
