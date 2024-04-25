// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using NUnit.Framework;
using Microsoft.Generator.CSharp.Input;

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

        // Tests that the BuildModels method is successfully overridden.
        [Test]
        public void BuildModels_Override()
        {
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.Models; });
        }

        // Tests that the BuildClients method is successfully overridden.
        [Test]
        public void BuildClients_Override()
        {
            Assert.Throws<NotImplementedException>(() => { object shouldFail = _outputLibrary.Clients; });
        }

        internal class MockOutputLibrary : OutputLibrary
        {
            public MockOutputLibrary() : base() { }

            public override ModelTypeProvider[] BuildModels()
            {
                throw new NotImplementedException();
            }

            public override ClientTypeProvider[] BuildClients()
            {
                throw new NotImplementedException();
            }
        }
    }
}
