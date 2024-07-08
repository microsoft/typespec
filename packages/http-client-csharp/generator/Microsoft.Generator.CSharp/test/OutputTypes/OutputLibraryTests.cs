// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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

        // Tests that the BuildTypeProviders method is successfully overridden.
        [Test]
        public void BuildTypeProviders_Override()
        {
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.TypeProviders; });
        }

        internal class MockOutputLibrary : OutputLibrary
        {
            public MockOutputLibrary() : base() { }

            protected override TypeProvider[] BuildTypeProviders()
            {
                throw new NotImplementedException();
            }
        }
    }
}
