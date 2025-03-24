// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Providers;
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
    }
}
