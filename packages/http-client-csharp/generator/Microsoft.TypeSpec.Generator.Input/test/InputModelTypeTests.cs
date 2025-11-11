// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
        public void IsDynamicModelPropagatesFromBaseToDevived()
        {
            // Create a base model that is dynamic
            var baseModel = InputFactory.Model("baseModel", isDynamicModel: true, properties: [
                InputFactory.Property("baseProp", InputPrimitiveType.String, isRequired: true)
            ]);

            // Create a derived model that is NOT marked as dynamic
            var derivedModel = InputFactory.Model("derivedModel", isDynamicModel: false, baseModel: baseModel, properties: [
                InputFactory.Property("derivedProp", InputPrimitiveType.String, isRequired: true)
            ]);

            // The derived model should be marked as dynamic because it inherits from a dynamic base
            Assert.IsTrue(derivedModel.IsDynamicModel, "Derived model should be marked as dynamic when inheriting from a dynamic base");
            Assert.IsTrue(baseModel.IsDynamicModel, "Base model should remain marked as dynamic");
        }
    }
}
