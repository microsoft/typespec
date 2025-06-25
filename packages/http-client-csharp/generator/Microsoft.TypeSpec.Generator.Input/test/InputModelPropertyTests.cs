// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputModelPropertyTests
    {
        [Test]
        public void CanUpdateModelPropertyName()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String);
            property.Update(name: "UpdatedName");

            Assert.AreEqual("UpdatedName", property.Name);
        }

        [Test]
        public void CanUpdateModelPropertySummary()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, summary: "Original summary");
            property.Update(summary: "Updated summary");

            Assert.AreEqual("Updated summary", property.Summary);
        }

        [Test]
        public void CanUpdateModelPropertyDoc()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, doc: "Original doc");
            property.Update(doc: "Updated doc");

            Assert.AreEqual("Updated doc", property.Doc);
        }

        [Test]
        public void CanUpdateModelPropertyType()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String);
            property.Update(type: InputPrimitiveType.Int32);

            Assert.AreEqual(InputPrimitiveType.Int32, property.Type);
        }

        [Test]
        public void CanUpdateModelPropertyIsRequired()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, isRequired: false);
            property.Update(isRequired: true);

            Assert.AreEqual(true, property.IsRequired);
        }

        [Test]
        public void CanUpdateModelPropertyIsReadOnly()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, isReadOnly: false);
            property.Update(isReadOnly: true);

            Assert.AreEqual(true, property.IsReadOnly);
        }

        [Test]
        public void CanUpdateModelPropertyIsDiscriminator()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, isDiscriminator: false);
            property.Update(isDiscriminator: true);

            Assert.AreEqual(true, property.IsDiscriminator);
        }

        [Test]
        public void CanUpdateModelPropertySerializedName()
        {
            var property = InputFactory.Property("TestProperty", InputPrimitiveType.String, serializedName: "original_name");
            property.Update(serializedName: "updated_name");

            Assert.AreEqual("updated_name", property.SerializedName);
        }

        [Test]
        public void CanUpdateMultipleProperties()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String, isRequired: false, isDiscriminator: false);
            property.Update(name: "UpdatedName", isRequired: true, isDiscriminator: true);

            Assert.AreEqual("UpdatedName", property.Name);
            Assert.AreEqual(true, property.IsRequired);
            Assert.AreEqual(true, property.IsDiscriminator);
        }

        [Test]
        public void UpdateWithNullParametersDoesNotChangeValues()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String, isRequired: true, isDiscriminator: true);
            var originalName = property.Name;
            var originalIsRequired = property.IsRequired;
            var originalIsDiscriminator = property.IsDiscriminator;

            property.Update(); // All parameters are null

            Assert.AreEqual(originalName, property.Name);
            Assert.AreEqual(originalIsRequired, property.IsRequired);
            Assert.AreEqual(originalIsDiscriminator, property.IsDiscriminator);
        }
    }
}