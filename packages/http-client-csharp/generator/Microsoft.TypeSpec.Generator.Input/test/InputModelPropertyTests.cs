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
    }
}