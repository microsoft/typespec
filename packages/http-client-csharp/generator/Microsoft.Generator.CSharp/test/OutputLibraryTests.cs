// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class OutputLibraryTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private OutputLibrary _outputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _outputLibrary = new MockOutputLibrary();
        }

        // Tests that the Providers property is successfully overridden.
        [Test]
        public void Providers_Override()
        {
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.Providers; });
        }

        internal class MockOutputLibrary : OutputLibrary
        {
            public MockOutputLibrary() : base() { }

            public override IEnumerable<TypeProvider> Providers => throw new NotImplementedException();
        }
    }
}
