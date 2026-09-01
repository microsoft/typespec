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

        [Test]
        public void CanUpdateModelName()
        {
            var model = InputFactory.Model("OriginalName");
            model.Update(name: "UpdatedName");

            Assert.AreEqual("UpdatedName", model.Name);
        }

        [Test]
        public void CanUpdateModelNamespace()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(@namespace: "Updated.Namespace");

            Assert.AreEqual("Updated.Namespace", model.Namespace);
        }

        [Test]
        public void CanUpdateModelCrossLanguageDefinitionId()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(crossLanguageDefinitionId: "Updated.Id");

            Assert.AreEqual("Updated.Id", model.CrossLanguageDefinitionId);
        }

        [Test]
        public void CanUpdateModelAccess()
        {
            var model = InputFactory.Model("TestModel", access: "public");
            model.Update(access: "internal");

            Assert.AreEqual("internal", model.Access);
        }

        [Test]
        public void CanUpdateModelDeprecation()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(deprecation: "This model is deprecated");

            Assert.AreEqual("This model is deprecated", model.Deprecation);
        }

        [Test]
        public void CanUpdateModelSummary()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(summary: "Updated summary");

            Assert.AreEqual("Updated summary", model.Summary);
        }

        [Test]
        public void CanUpdateModelDoc()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(doc: "Updated documentation");

            Assert.AreEqual("Updated documentation", model.Doc);
        }

        [Test]
        public void CanUpdateModelUsage()
        {
            var model = InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input);
            model.Update(usage: InputModelTypeUsage.Output);

            Assert.AreEqual(InputModelTypeUsage.Output, model.Usage);
        }

        [Test]
        public void CanUpdateModelProperties()
        {
            var model = InputFactory.Model("TestModel");
            var newProperty = InputFactory.Property("NewProperty", InputPrimitiveType.Int32);

            model.Update(properties: [newProperty]);

            Assert.AreEqual(1, model.Properties.Count);
            Assert.AreEqual(newProperty, model.Properties[0]);
        }

        [Test]
        public void UpdateModelPropertiesSetsEnclosingType()
        {
            var model = InputFactory.Model("TestModel");
            var newProperty = InputFactory.Property("NewProperty", InputPrimitiveType.Int32);

            model.Update(properties: [newProperty]);

            Assert.AreEqual(model, newProperty.EnclosingType);
        }

        [Test]
        public void CanUpdateModelBaseModel()
        {
            var model = InputFactory.Model("TestModel");
            var baseModel = InputFactory.Model("BaseModel");

            model.Update(baseModel: baseModel);

            Assert.AreEqual(baseModel, model.BaseModel);
        }

        [Test]
        public void CanUpdateModelDiscriminatorValue()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(discriminatorValue: "updatedKind");

            Assert.AreEqual("updatedKind", model.DiscriminatorValue);
        }

        [Test]
        public void CanUpdateModelDiscriminatorProperty()
        {
            var model = InputFactory.Model("TestModel");
            var discriminatorProperty = InputFactory.Property("kind", InputPrimitiveType.String, isDiscriminator: true);

            model.Update(discriminatorProperty: discriminatorProperty);

            Assert.AreEqual(discriminatorProperty, model.DiscriminatorProperty);
        }

        [Test]
        public void CanUpdateModelAdditionalProperties()
        {
            var model = InputFactory.Model("TestModel");
            model.Update(additionalProperties: InputPrimitiveType.String);

            Assert.AreEqual(InputPrimitiveType.String, model.AdditionalProperties);
        }

        [Test]
        public void CanUpdateModelAsStruct()
        {
            var model = InputFactory.Model("TestModel", modelAsStruct: false);
            model.Update(modelAsStruct: true);

            Assert.IsTrue(model.ModelAsStruct);
        }

        [Test]
        public void CanUpdateModelSerializationOptions()
        {
            var model = InputFactory.Model("TestModel");
            var serializationOptions = new InputSerializationOptions(json: new InputJsonSerializationOptions("jsonName"));

            model.Update(serializationOptions: serializationOptions);

            Assert.AreEqual(serializationOptions, model.SerializationOptions);
        }

        [Test]
        public void CanUpdateModelIsDynamicModel()
        {
            var model = InputFactory.Model("TestModel", isDynamicModel: false);
            model.Update(isDynamicModel: true);

            Assert.IsTrue(model.IsDynamicModel);
        }

        [Test]
        public void CanUpdateMultipleModelPropertiesAtOnce()
        {
            var model = InputFactory.Model("OriginalName", usage: InputModelTypeUsage.Input, modelAsStruct: false);

            model.Update(
                name: "UpdatedName",
                summary: "Updated summary",
                usage: InputModelTypeUsage.Output,
                modelAsStruct: true);

            Assert.AreEqual("UpdatedName", model.Name);
            Assert.AreEqual("Updated summary", model.Summary);
            Assert.AreEqual(InputModelTypeUsage.Output, model.Usage);
            Assert.IsTrue(model.ModelAsStruct);
        }

        [Test]
        public void UpdateWithNullParametersDoesNotChangeModel()
        {
            var model = InputFactory.Model("OriginalName", usage: InputModelTypeUsage.Input, modelAsStruct: true, isDynamicModel: true);
            var originalName = model.Name;
            var originalNamespace = model.Namespace;
            var originalCrossLanguageDefinitionId = model.CrossLanguageDefinitionId;
            var originalAccess = model.Access;
            var originalDeprecation = model.Deprecation;
            var originalSummary = model.Summary;
            var originalDoc = model.Doc;
            var originalUsage = model.Usage;
            var originalProperties = model.Properties;
            var originalBaseModel = model.BaseModel;
            var originalDiscriminatorValue = model.DiscriminatorValue;
            var originalDiscriminatorProperty = model.DiscriminatorProperty;
            var originalAdditionalProperties = model.AdditionalProperties;
            var originalModelAsStruct = model.ModelAsStruct;
            var originalSerializationOptions = model.SerializationOptions;
            var originalIsDynamicModel = model.IsDynamicModel;

            model.Update(); // All parameters are null

            Assert.AreEqual(originalName, model.Name);
            Assert.AreEqual(originalNamespace, model.Namespace);
            Assert.AreEqual(originalCrossLanguageDefinitionId, model.CrossLanguageDefinitionId);
            Assert.AreEqual(originalAccess, model.Access);
            Assert.AreEqual(originalDeprecation, model.Deprecation);
            Assert.AreEqual(originalSummary, model.Summary);
            Assert.AreEqual(originalDoc, model.Doc);
            Assert.AreEqual(originalUsage, model.Usage);
            Assert.AreEqual(originalProperties, model.Properties);
            Assert.AreEqual(originalBaseModel, model.BaseModel);
            Assert.AreEqual(originalDiscriminatorValue, model.DiscriminatorValue);
            Assert.AreEqual(originalDiscriminatorProperty, model.DiscriminatorProperty);
            Assert.AreEqual(originalAdditionalProperties, model.AdditionalProperties);
            Assert.AreEqual(originalModelAsStruct, model.ModelAsStruct);
            Assert.AreEqual(originalSerializationOptions, model.SerializationOptions);
            Assert.AreEqual(originalIsDynamicModel, model.IsDynamicModel);
        }
    }
}
