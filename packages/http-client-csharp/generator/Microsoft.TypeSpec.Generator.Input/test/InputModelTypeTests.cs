// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
    }
}
