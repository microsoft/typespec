// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class OutputLibraryTests
    {

        // Tests that the BuildTypeProviders method is successfully overridden.
        [Test]
        public void BuildTypeProviders_Override()
        {
            var mockOutputLibrary = new Mock<OutputLibrary>();
            mockOutputLibrary.Protected().Setup<TypeProvider[]>("BuildTypeProviders").Throws<NotImplementedException>();
            Assert.Throws<NotImplementedException>(() => { object shouldFail = mockOutputLibrary.Object.TypeProviders; });
        }

        [Test]
        public void ConstantsShouldNotBeTurnedIntoEnums()
        {
            var plugin = MockHelpers.LoadMockGenerator(inputLiteralTypes: [InputFactory.Literal.String("foo"), InputFactory.Literal.Int32(42)]);
            var outputLibrary = plugin.Object.OutputLibrary;
            Assert.AreEqual(0, outputLibrary.TypeProviders.Count(t => t is EnumProvider));
        }
    }
}
