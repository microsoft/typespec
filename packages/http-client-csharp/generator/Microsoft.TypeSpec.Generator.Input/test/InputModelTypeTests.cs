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
    }
}
