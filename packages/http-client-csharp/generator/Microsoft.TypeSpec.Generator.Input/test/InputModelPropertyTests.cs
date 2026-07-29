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
        public void UpdateWithNullNameDoesNotChangeName()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String);
            var originalName = property.Name;

            property.Update(); // name parameter is null

            Assert.AreEqual(originalName, property.Name);
        }

        [Test]
        public void CanUpdateModelPropertySummary()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String);
            property.Update(summary: "Updated summary");

            Assert.AreEqual("Updated summary", property.Summary);
        }

        [Test]
        public void CanUpdateModelPropertyDoc()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String);
            property.Update(doc: "Updated documentation");

            Assert.AreEqual("Updated documentation", property.Doc);
        }

        [Test]
        public void CanUpdateModelPropertyType()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String);
            property.Update(type: InputPrimitiveType.Int32);

            Assert.AreEqual(InputPrimitiveType.Int32, property.Type);
        }

        [Test]
        public void CanUpdateModelPropertyIsRequired()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String, isRequired: false);
            property.Update(isRequired: true);

            Assert.IsTrue(property.IsRequired);
        }

        [Test]
        public void CanUpdateModelPropertyIsReadOnly()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String, isReadOnly: false);
            property.Update(isReadOnly: true);

            Assert.IsTrue(property.IsReadOnly);
        }

        [Test]
        public void CanUpdateModelPropertyAccess()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String);
            property.Update(access: "private");

            Assert.AreEqual("private", property.Access);
        }

        [Test]
        public void CanUpdateModelPropertyIsDiscriminator()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String, isDiscriminator: false);
            property.Update(isDiscriminator: true);

            Assert.IsTrue(property.IsDiscriminator);
        }

        [Test]
        public void CanUpdateModelPropertySerializedName()
        {
            var property = InputFactory.Property("TestName", InputPrimitiveType.String);
            property.Update(serializedName: "updated_name");

            Assert.AreEqual("updated_name", property.SerializedName);
        }

        [Test]
        public void CanUpdateMultiplePropertiesAtOnce()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String, isRequired: false, isDiscriminator: false);
            
            property.Update(
                name: "UpdatedName",
                summary: "Updated summary",
                isRequired: true,
                isDiscriminator: true
            );

            Assert.AreEqual("UpdatedName", property.Name);
            Assert.AreEqual("Updated summary", property.Summary);
            Assert.IsTrue(property.IsRequired);
            Assert.IsTrue(property.IsDiscriminator);
        }

        [Test]
        public void UpdateWithNullParametersDoesNotChangeProperties()
        {
            var property = InputFactory.Property("OriginalName", InputPrimitiveType.String, isRequired: true, isDiscriminator: true);
            var originalName = property.Name;
            var originalSummary = property.Summary;
            var originalDoc = property.Doc;
            var originalType = property.Type;
            var originalIsRequired = property.IsRequired;
            var originalIsReadOnly = property.IsReadOnly;
            var originalAccess = property.Access;
            var originalIsDiscriminator = property.IsDiscriminator;
            var originalSerializedName = property.SerializedName;
            var originalSerializationOptions = property.SerializationOptions;

            property.Update(); // All parameters are null

            Assert.AreEqual(originalName, property.Name);
            Assert.AreEqual(originalSummary, property.Summary);
            Assert.AreEqual(originalDoc, property.Doc);
            Assert.AreEqual(originalType, property.Type);
            Assert.AreEqual(originalIsRequired, property.IsRequired);
            Assert.AreEqual(originalIsReadOnly, property.IsReadOnly);
            Assert.AreEqual(originalAccess, property.Access);
            Assert.AreEqual(originalIsDiscriminator, property.IsDiscriminator);
            Assert.AreEqual(originalSerializedName, property.SerializedName);
            Assert.AreEqual(originalSerializationOptions, property.SerializationOptions);
        }
    }
}