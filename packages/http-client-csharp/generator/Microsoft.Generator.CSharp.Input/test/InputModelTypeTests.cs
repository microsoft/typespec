// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Input.Tests
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
    }
}
