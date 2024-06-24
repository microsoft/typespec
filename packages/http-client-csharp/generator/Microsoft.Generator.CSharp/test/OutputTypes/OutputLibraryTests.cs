// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.OutputTypes
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

        // Tests that the BuildTypes method is successfully overridden.
        [Test]
        public void BuildTypes_Override()
        {
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.Types; });
        }

        internal class MockOutputLibrary : OutputLibrary
        {
            public MockOutputLibrary() : base() { }

            protected override IReadOnlyList<TypeProvider> BuildTypes()
            {
                throw new NotImplementedException();
            }
        }
    }
}
