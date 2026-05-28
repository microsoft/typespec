// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class JsonModelCoreTests
    {
        public JsonModelCoreTests()
        {
            MockHelpers.LoadMockGenerator(createSerializationsCore: (inputType, typeProvider)
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : []);
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => m.Signature.Name.Equals("JsonModelWriteCore"))];
            }

            protected internal override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
        }

        [Test]
        public void KebabCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("kebab-case", InputPrimitiveType.String, wireName: "kebab-case", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void SnakeCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("snake_case", InputPrimitiveType.String, wireName: "snake_case", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PascalCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("PascalCase", InputPrimitiveType.String, wireName: "PascalCase", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void CamelCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("camelCase", InputPrimitiveType.String, wireName: "camelCase", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultipleAdditionalProperties()
        {
            var inputModel = InputFactory.Model("TestModel", properties: [InputFactory.Property("color", InputPrimitiveType.String, isRequired: true)], additionalProperties: new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]));

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void BinaryDataAdditionalProperties()
        {
            var inputModel = InputFactory.Model("TestModel", properties: [InputFactory.Property("color", InputPrimitiveType.String, isRequired: true)], additionalProperties: InputPrimitiveType.Any);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // This test validates that non-body properties are not included in the body serialization of the model
        [Test]
        public void NonBodyPropertyKindsInModel()
        {
            var inputModel = InputFactory.Model(
               "ModelWithNonBodyParameters",
               properties:
               [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true, isHttpMetadata: true),
                    InputFactory.Property("cat", InputPrimitiveType.String, serializedName: "x-cat", isRequired: true, isHttpMetadata: true),
                    InputFactory.Property("bar", InputPrimitiveType.Int32, isRequired: true)
               ]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that duration properties encoded as integer milliseconds/seconds are always
        // serialized as integers, regardless of the wire-type integer kind (e.g. integer, int64, etc.).
        [TestCase(nameof(InputPrimitiveType.Int32), ExpectedResult = true)]
        [TestCase(nameof(InputPrimitiveType.Int64), ExpectedResult = true)]
        [TestCase(nameof(InputPrimitiveTypeKind.Integer), ExpectedResult = true)]
        public bool DurationMillisecondsIntegerWireTypeWritesAsInt(string wireKindName)
        {
            var wireType = wireKindName switch
            {
                nameof(InputPrimitiveType.Int32) => InputPrimitiveType.Int32,
                nameof(InputPrimitiveType.Int64) => InputPrimitiveType.Int64,
                nameof(InputPrimitiveTypeKind.Integer) => new InputPrimitiveType(InputPrimitiveTypeKind.Integer, "integer", "TypeSpec.integer"),
                _ => throw new System.ArgumentException(wireKindName),
            };
            var durationType = new InputDurationType(DurationKnownEncoding.Milliseconds, "duration", "TypeSpec.duration", wireType, null);
            var inputModel = InputFactory.Model(
                "TestModel",
                properties: [InputFactory.Property("audio_end_ms", durationType, wireName: "audio_end_ms", isRequired: true)]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var content = writer.Write().Content;

            // Always wrap TotalMilliseconds in Convert.ToInt32 so the JSON value is an integer,
            // and never emit the raw double value.
            Assert.That(
                content,
                Does.Contain("writer.WriteNumberValue(global::System.Convert.ToInt32(AudioEndMs.TotalMilliseconds));"));
            Assert.That(content, Does.Not.Contain("writer.WriteNumberValue(AudioEndMs.TotalMilliseconds)"));
            return true;
        }

        // Validates that duration properties encoded as float/double milliseconds preserve the
        // floating-point value (no integer rounding).
        [TestCase(nameof(InputPrimitiveType.Float32))]
        [TestCase(nameof(InputPrimitiveType.Float64))]
        public void DurationMillisecondsFloatWireTypeWritesAsDouble(string wireKindName)
        {
            var wireType = wireKindName switch
            {
                nameof(InputPrimitiveType.Float32) => InputPrimitiveType.Float32,
                nameof(InputPrimitiveType.Float64) => InputPrimitiveType.Float64,
                _ => throw new System.ArgumentException(wireKindName),
            };
            var durationType = new InputDurationType(DurationKnownEncoding.Milliseconds, "duration", "TypeSpec.duration", wireType, null);
            var inputModel = InputFactory.Model(
                "TestModel",
                properties: [InputFactory.Property("audio_end_ms", durationType, wireName: "audio_end_ms", isRequired: true)]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var content = writer.Write().Content;

            Assert.That(content, Does.Contain("writer.WriteNumberValue(AudioEndMs.TotalMilliseconds);"));
            Assert.That(content, Does.Not.Contain("global::System.Convert.ToInt32(AudioEndMs.TotalMilliseconds)"));
        }
    }
}
