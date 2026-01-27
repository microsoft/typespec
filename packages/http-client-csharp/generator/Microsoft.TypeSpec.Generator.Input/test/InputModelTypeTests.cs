// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    internal class InputModelTypeTests
    {
        [Test]
        public void EnclosingTypeIsSet()
        {
            var property = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true);
            var model1 = InputFactory.Model("foo", "internal", usage: InputModelTypeUsage.Input, properties: [property]);
            Assert.AreEqual(model1, property.EnclosingType);

            var model2 = InputFactory.Model("bar", "internal", usage: InputModelTypeUsage.Input, properties: [property]);
            Assert.AreEqual(model2, property.EnclosingType);
        }

        [Test]
        public void SerializedNameIsSetToWireName()
        {
            var property = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true, wireName: "foo");
            Assert.AreEqual("foo", property.SerializedName);
        }

        [Test]
        public void SerializedNameFallsBackToPropertyName()
        {
            var property = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true);
            Assert.AreEqual("prop1", property.SerializedName);
        }

        [Test]
        public void IsDynamicModelPropagatesFromBaseToDerived()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            var baseModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "BaseModel");
            Assert.IsNotNull(baseModel);
            Assert.IsTrue(baseModel!.IsDynamicModel, "Base model should be marked as dynamic");

            var derivedModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "DerivedModel");
            Assert.IsNotNull(derivedModel);
            Assert.IsTrue(derivedModel!.IsDynamicModel, "Derived model should be marked as dynamic when inheriting from a dynamic base");
        }

        [TestCase(true)]
        [TestCase(false)]
        public void UnknownDiscriminatorTypeDynamicMatchesBase(bool isDynamic)
        {
            var baseModel = InputFactory.Model("BaseModel", "internal", usage: InputModelTypeUsage.Input, isDynamicModel: isDynamic);
            var derivedModel = InputFactory.Model("DerivedModel", "internal", usage: InputModelTypeUsage.Input, baseModel: baseModel);

            Assert.AreEqual(isDynamic, derivedModel.IsDynamicModel, $"Derived model should have IsDynamicModel={isDynamic} when base has IsDynamicModel={isDynamic}");
        }

        [Test]
        public void IsDynamicModelPropagatesWithDiscriminator()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            // Base model with @dynamicModel decorator and discriminator
            var fooModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "Foo");
            Assert.IsNotNull(fooModel);
            Assert.IsTrue(fooModel!.IsDynamicModel, "Base model Foo should be marked as dynamic");

            // Known discriminated subtype should be marked as dynamic
            var barModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "Bar");
            Assert.IsNotNull(barModel);
            Assert.IsTrue(barModel!.IsDynamicModel, "Discriminated subtype Bar should be marked as dynamic when base is dynamic");

            // Unknown discriminator model should also be marked as dynamic
            var unknownFooModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "UnknownFoo");
            Assert.IsNotNull(unknownFooModel);
            Assert.IsTrue(unknownFooModel!.IsDynamicModel, "UnknownFoo model should be marked as dynamic when base is dynamic");
        }

        [Test]
        public void XmlSerializationOptionsAreDeserializedCorrectly()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                    new InputXmlSerializationOptionsConverter(),
                    new InputArrayTypeConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            var xmlBookModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "XmlBook");
            Assert.IsNotNull(xmlBookModel);
            Assert.IsNotNull(xmlBookModel!.SerializationOptions);
            Assert.IsNotNull(xmlBookModel.SerializationOptions.Xml);
            Assert.AreEqual("XmlBookElement", xmlBookModel.SerializationOptions.Xml!.Name);

            var idProperty = xmlBookModel.Properties.SingleOrDefault(p => p.Name == "id");
            Assert.IsNotNull(idProperty);
            Assert.IsNotNull(idProperty!.SerializationOptions);
            Assert.IsNotNull(idProperty.SerializationOptions!.Xml);
            Assert.AreEqual("id", idProperty.SerializationOptions.Xml!.Name);
            Assert.IsTrue(idProperty.SerializationOptions.Xml.Attribute);
            Assert.IsFalse(idProperty.SerializationOptions.Xml.Unwrapped);

            var titleProperty = xmlBookModel.Properties.SingleOrDefault(p => p.Name == "title");
            Assert.IsNotNull(titleProperty);
            Assert.IsNotNull(titleProperty!.SerializationOptions);
            Assert.IsNotNull(titleProperty.SerializationOptions!.Xml);
            Assert.AreEqual("BookTitle", titleProperty.SerializationOptions.Xml!.Name);
            Assert.IsFalse(titleProperty.SerializationOptions.Xml.Attribute);
            Assert.IsFalse(titleProperty.SerializationOptions.Xml.Unwrapped);
            Assert.AreEqual("BookTitle", titleProperty.SerializedName);

            var authorsProperty = xmlBookModel.Properties.SingleOrDefault(p => p.Name == "authors");
            Assert.IsNotNull(authorsProperty);
            Assert.IsNotNull(authorsProperty!.SerializationOptions);
            Assert.IsNotNull(authorsProperty.SerializationOptions!.Xml);
            Assert.AreEqual("authors", authorsProperty.SerializationOptions.Xml!.Name);
            Assert.IsFalse(authorsProperty.SerializationOptions.Xml.Attribute);
            Assert.IsTrue(authorsProperty.SerializationOptions.Xml.Unwrapped);
            Assert.AreEqual("author", authorsProperty.SerializationOptions.Xml.ItemsName);

            var contentProperty = xmlBookModel.Properties.SingleOrDefault(p => p.Name == "content");
            Assert.IsNotNull(contentProperty);
            Assert.IsNotNull(contentProperty!.SerializationOptions);
            Assert.IsNotNull(contentProperty.SerializationOptions!.Xml);
            Assert.AreEqual("content", contentProperty.SerializationOptions.Xml!.Name);
            Assert.IsFalse(contentProperty.SerializationOptions.Xml.Attribute);
            Assert.IsFalse(contentProperty.SerializationOptions.Xml.Unwrapped);
        }

        [Test]
        public void UnknownDiscriminatedModelWithXmlOnlyUsageDoesNotAddJson()
        {
            var discriminatorProperty = InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true);
            var derivedModel = InputFactory.Model(
                "DerivedModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)],
                discriminatedKind: "derived");

            var baseModel = InputFactory.Model(
                "BaseModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Xml,
                properties: [discriminatorProperty],
                discriminatorProperty: discriminatorProperty,
                discriminatedModels: new Dictionary<string, InputModelType> { { "derived", derivedModel } });

            // Verify the unknown discriminated model was created
            Assert.IsTrue(baseModel.DiscriminatedSubtypes.ContainsKey("unknown"), "Unknown discriminated subtype should be created");
            var unknownModel = baseModel.DiscriminatedSubtypes["unknown"];

            // Validate the unknown model has XML flag but NOT Json flag (since base is XML-only)
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Xml), "Unknown model should have Xml usage flag from base");
            Assert.IsFalse(unknownModel.Usage.HasFlag(InputModelTypeUsage.Json), "Unknown model should NOT have Json usage flag when base is XML-only");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Input), "Unknown model should have Input usage flag from base");
        }

        [Test]
        public void UnknownDiscriminatedModelWithNonXmlUsageAddsJson()
        {
            var discriminatorProperty = InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true);
            var derivedModel = InputFactory.Model(
                "DerivedModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                properties: [InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)],
                discriminatedKind: "derived");
            var baseModel = InputFactory.Model(
                "BaseModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                properties: [discriminatorProperty],
                discriminatorProperty: discriminatorProperty,
                discriminatedModels: new Dictionary<string, InputModelType> { { "derived", derivedModel } });

            // Verify the unknown discriminated model was created
            Assert.IsTrue(baseModel.DiscriminatedSubtypes.ContainsKey("unknown"), "Unknown discriminated subtype should be created");
            var unknownModel = baseModel.DiscriminatedSubtypes["unknown"];

            // Validate the unknown model has Json flag added (since base is non-XML)
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Json), "Unknown model should have Json usage flag added when base is non-XML");
            Assert.IsFalse(unknownModel.Usage.HasFlag(InputModelTypeUsage.Xml), "Unknown model should NOT have Xml usage flag");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Input), "Unknown model should have Input usage flag from base");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Output), "Unknown model should have Output usage flag from base");
        }

        [Test]
        public void UnknownDiscriminatedModelWithBothXmlAndJsonUsageRetainsBoth()
        {
            var discriminatorProperty = InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true);
            var derivedModel = InputFactory.Model(
                "DerivedModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Xml | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)],
                discriminatedKind: "derived");

            var baseModel = InputFactory.Model(
                "BaseModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Xml | InputModelTypeUsage.Json,
                properties: [discriminatorProperty],
                discriminatorProperty: discriminatorProperty,
                discriminatedModels: new Dictionary<string, InputModelType> { { "derived", derivedModel } });

            Assert.IsTrue(baseModel.DiscriminatedSubtypes.ContainsKey("unknown"), "Unknown discriminated subtype should be created");
            var unknownModel = baseModel.DiscriminatedSubtypes["unknown"];

            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Xml), "Unknown model should have Xml usage flag from base");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Json), "Unknown model should have Json usage flag from base");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Input), "Unknown model should have Input usage flag from base");
            Assert.IsTrue(unknownModel.Usage.HasFlag(InputModelTypeUsage.Output), "Unknown model should have Output usage flag from base");
        }
    }
}
